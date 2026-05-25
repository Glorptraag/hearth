import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFamily, routeHandler } from '@/lib/api-helpers';
import { getFamilyPackIds } from '@/lib/entitlements';
import { sanityClient } from '@/lib/sanity/client';

/**
 * GET /api/library/materials
 *
 * Returns a flat list of all assets and commons texts across the family's library packs.
 * Supports filtering by kind and packId.
 *
 * Query params:
 *   ?kind=template|worksheet|reference|... — filter by asset kind
 *   ?packId=X — filter to a specific pack
 *   ?sort=alpha|kind|pack — sort order (default: alpha)
 */
export const GET = routeHandler(async (request: NextRequest) => {
  const result = await authenticatedFamily({ rateLimitKey: 'library-materials', rateLimit: 30 });
  if ('error' in result) return result.error;

  const packIds = await getFamilyPackIds(result.family.id);
  if (packIds.length === 0) {
    return NextResponse.json({ assets: [], commonsTexts: [], totalPrintablePages: 0 });
  }

  const kindFilter = request.nextUrl.searchParams.get('kind');
  const packIdFilter = request.nextUrl.searchParams.get('packId');
  const sortParam = request.nextUrl.searchParams.get('sort') ?? 'alpha';

  // Query: filter to specific pack or all library packs
  const targetPackIds = packIdFilter ? [packIdFilter] : packIds;

  // Verify the requested pack is in the family's library
  if (packIdFilter && !packIds.includes(packIdFilter)) {
    return NextResponse.json({ assets: [], commonsTexts: [], totalPrintablePages: 0 });
  }

  // Fetch all materials across the target packs
  const packsData = await sanityClient.fetch<Array<{
    _id: string;
    title: string;
    modules: Array<{
      _id: string;
      title: string;
      approaches: Array<{
        activities: Array<{
          _id: string;
          title: string;
          assets?: Array<{
            _key: string;
            role: string;
            notes?: string;
            asset: {
              _id: string;
              title: string;
              slug?: { current: string };
              kind: string;
              pageCount?: number;
              description?: string;
              printGuidance?: string;
              ageBand?: string;
              status: string;
              fileUrl?: string;
              thumbnailUrl?: string;
            };
          }>;
          commonsTexts?: Array<{
            _key: string;
            role: string;
            presentationMode?: string;
            notes?: string;
            text: {
              _id: string;
              title: string;
              slug?: { current: string };
              kind: string;
              tradition?: string;
              estimatedReadAloudMinutes?: number;
              length?: string;
              source?: string;
              status: string;
            };
          }>;
        }>;
      }>;
    }>;
  }>>(
    `*[_type == "pack" && _id in $packIds]{
      _id, title,
      modules[]->{
        _id, title,
        approaches[]->{
          activities[]->{
            _id, title,
            assets[]{
              _key, role, notes,
              asset->{ _id, title, slug, kind, pageCount, description, printGuidance, ageBand, status,
                "fileUrl": file.asset->url,
                "thumbnailUrl": thumbnail.asset->url
              }
            },
            commonsTexts[]{
              _key, role, presentationMode, notes,
              text->{ _id, title, slug, kind, tradition, estimatedReadAloudMinutes, length, source, status }
            }
          }
        }
      }
    }`,
    { packIds: targetPackIds },
  );

  // Flatten and deduplicate
  const assetMap = new Map<string, {
    asset: typeof packsData[0]['modules'][0]['approaches'][0]['activities'][0]['assets'] extends (infer U)[] | undefined ? U extends { asset: infer A } ? A : never : never;
    role: string;
    packTitle: string;
    moduleTitle: string;
    activityTitle: string;
  }>();

  const commonsTextMap = new Map<string, {
    text: typeof packsData[0]['modules'][0]['approaches'][0]['activities'][0]['commonsTexts'] extends (infer U)[] | undefined ? U extends { text: infer T } ? T : never : never;
    role: string;
    presentationMode?: string;
    packTitle: string;
    moduleTitle: string;
    activityTitle: string;
  }>();

  for (const pack of packsData) {
    for (const mod of pack.modules ?? []) {
      for (const approach of mod.approaches ?? []) {
        for (const activity of approach.activities ?? []) {
          for (const ref of activity.assets ?? []) {
            if (ref.asset && !assetMap.has(ref.asset._id)) {
              assetMap.set(ref.asset._id, {
                asset: ref.asset,
                role: ref.role,
                packTitle: pack.title,
                moduleTitle: mod.title,
                activityTitle: activity.title,
              });
            }
          }
          for (const ref of activity.commonsTexts ?? []) {
            if (ref.text && !commonsTextMap.has(ref.text._id)) {
              commonsTextMap.set(ref.text._id, {
                text: ref.text,
                role: ref.role,
                presentationMode: ref.presentationMode,
                packTitle: pack.title,
                moduleTitle: mod.title,
                activityTitle: activity.title,
              });
            }
          }
        }
      }
    }
  }

  // Apply kind filter
  let assets = Array.from(assetMap.values());
  let commonsTexts = Array.from(commonsTextMap.values());

  if (kindFilter) {
    if (kindFilter === 'commonsText' || kindFilter === 'read') {
      assets = [];
    } else if (kindFilter === 'audio') {
      assets = assets.filter((a) => a.asset.kind === 'audio');
      commonsTexts = [];
    } else if (kindFilter === 'print') {
      assets = assets.filter((a) => a.asset.kind !== 'audio');
      commonsTexts = [];
    } else {
      assets = assets.filter((a) => a.asset.kind === kindFilter);
      commonsTexts = [];
    }
  }

  // Sort
  const sortFn = (a: { asset?: { title: string }; text?: { title: string }; packTitle: string }) => {
    const title = a.asset?.title ?? a.text?.title ?? '';
    if (sortParam === 'pack') return a.packTitle + title;
    return title;
  };

  assets.sort((a, b) => sortFn(a).localeCompare(sortFn(b)));
  commonsTexts.sort((a, b) => sortFn(a).localeCompare(sortFn(b)));

  const totalPrintablePages = assets
    .filter((a) => a.asset.kind !== 'audio')
    .reduce((sum, a) => sum + (a.asset.pageCount ?? 0), 0);

  return NextResponse.json({
    assets: assets.map((a) => ({
      ...a.asset,
      role: a.role,
      packTitle: a.packTitle,
      moduleTitle: a.moduleTitle,
      activityTitle: a.activityTitle,
    })),
    commonsTexts: commonsTexts.map((c) => ({
      ...c.text,
      role: c.role,
      presentationMode: c.presentationMode,
      packTitle: c.packTitle,
      moduleTitle: c.moduleTitle,
      activityTitle: c.activityTitle,
    })),
    totalPrintablePages,
  });
}, { route: 'GET /api/library/materials' });
