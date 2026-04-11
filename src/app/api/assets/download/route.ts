import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFamily, apiError } from '@/lib/api-helpers';
import { canAccessAsset, getUpsellPack } from '@/lib/entitlements';
import { sanityClient } from '@/lib/sanity/client';
import { ASSET_DETAIL_QUERY } from '@/lib/sanity/queries';

/**
 * GET /api/assets/download?id=X
 *
 * Streams an asset file from Sanity CDN after entitlement check.
 * Never exposes raw Sanity CDN URLs to the client.
 */
export async function GET(request: NextRequest) {
  const result = await authenticatedFamily({ rateLimitKey: 'asset-download', rateLimit: 30 });
  if ('error' in result) return result.error;

  const assetId = request.nextUrl.searchParams.get('id');
  if (!assetId) return apiError('Missing id parameter', 400);

  // Entitlement check
  const hasAccess = await canAccessAsset(result.family.id, assetId);
  if (!hasAccess) {
    const upsell = await getUpsellPack(assetId);
    return NextResponse.json(
      {
        error: 'not_entitled',
        message: upsell
          ? `Add the ${upsell.packTitle} pack to your library to access this material.`
          : 'You do not have access to this material.',
        packId: upsell?.packId,
        packTitle: upsell?.packTitle,
      },
      { status: 403 },
    );
  }

  // Fetch asset metadata to get file URL
  const asset = await sanityClient.fetch<{
    _id: string;
    title: string;
    fileUrl?: string;
    slug?: { current: string };
  }>(ASSET_DETAIL_QUERY, { id: assetId });

  if (!asset?.fileUrl) {
    return apiError('Asset file not found', 404);
  }

  // Stream the file from Sanity CDN
  const fileResponse = await fetch(asset.fileUrl);
  if (!fileResponse.ok) {
    return apiError('Failed to fetch asset file', 502);
  }

  const contentType = fileResponse.headers.get('content-type') ?? 'application/octet-stream';
  const slug = asset.slug?.current ?? 'download';
  const extension = contentType.includes('pdf') ? '.pdf' : contentType.includes('png') ? '.png' : '';
  const filename = `hearth-${slug}${extension}`;

  return new NextResponse(fileResponse.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
