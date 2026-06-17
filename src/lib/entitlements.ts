import { db } from '@/lib/db';
import { familyLibrary } from '@/lib/db/schema';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { sanityClient } from '@/lib/sanity/client';
import { ASSET_ENTITLEMENT_QUERY, COMMONS_TEXT_ENTITLEMENT_QUERY } from '@/lib/sanity/queries';

/**
 * Get all Sanity pack IDs that a family has in their library.
 * Cached per request — call once and pass the result to check functions.
 */
export async function getFamilyPackIds(familyId: string): Promise<string[]> {
  const records = await db
    .select({ sanityPackId: familyLibrary.sanityPackId })
    .from(familyLibrary)
    .where(
      and(
        eq(familyLibrary.familyId, familyId),
        isNotNull(familyLibrary.sanityPackId),
        // A soft-removed pack must not keep granting asset/commons-text access.
        // Mirrors the partial-index predicate on familyLibrary (removed_at IS NULL).
        isNull(familyLibrary.removedAt),
      ),
    );
  return records.map((r) => r.sanityPackId).filter((id): id is string => !!id);
}

/**
 * Check whether a family can access a specific asset.
 * Traces the asset back to its pack(s) via Sanity references,
 * then checks if any of those packs are in the family's library.
 */
export async function canAccessAsset(familyId: string, assetId: string): Promise<boolean> {
  const familyPackIds = await getFamilyPackIds(familyId);
  if (familyPackIds.length === 0) return false;

  const packs = await sanityClient.fetch<Array<{ _id: string }>>(
    ASSET_ENTITLEMENT_QUERY,
    { assetId },
  );

  return packs.some((p) => familyPackIds.includes(p._id));
}

/**
 * Check whether a family can access a specific commons text.
 * Same pattern as canAccessAsset but traces commonsText references.
 */
export async function canAccessCommonsText(familyId: string, textId: string): Promise<boolean> {
  const familyPackIds = await getFamilyPackIds(familyId);
  if (familyPackIds.length === 0) return false;

  const packs = await sanityClient.fetch<Array<{ _id: string }>>(
    COMMONS_TEXT_ENTITLEMENT_QUERY,
    { textId },
  );

  return packs.some((p) => familyPackIds.includes(p._id));
}

/**
 * Check access for multiple items at once. Returns the IDs that failed.
 * More efficient than calling canAccessAsset/canAccessCommonsText in a loop
 * because it fetches familyPackIds once.
 */
export async function checkBulkAccess(
  familyId: string,
  items: Array<{ id: string; kind: 'asset' | 'commonsText' }>,
): Promise<{ allowed: string[]; denied: string[] }> {
  const familyPackIds = await getFamilyPackIds(familyId);
  if (familyPackIds.length === 0) {
    return { allowed: [], denied: items.map((i) => i.id) };
  }

  const allowed: string[] = [];
  const denied: string[] = [];

  for (const item of items) {
    const query = item.kind === 'asset' ? ASSET_ENTITLEMENT_QUERY : COMMONS_TEXT_ENTITLEMENT_QUERY;
    const paramKey = item.kind === 'asset' ? 'assetId' : 'textId';

    const packs = await sanityClient.fetch<Array<{ _id: string }>>(
      query,
      { [paramKey]: item.id },
    );

    if (packs.some((p) => familyPackIds.includes(p._id))) {
      allowed.push(item.id);
    } else {
      denied.push(item.id);
    }
  }

  return { allowed, denied };
}

/**
 * Get the upsell info for an asset the family doesn't have access to.
 * Returns the pack name and slug so the UI can show "Available with X pack".
 */
export async function getUpsellPack(assetId: string): Promise<{ packId: string; packTitle: string; packSlug: string } | null> {
  const pack = await sanityClient.fetch<{ _id: string; title: string; slug: { current: string } } | null>(
    // Sanity-gated: upsell never reveals a draft pack.
    // See src/lib/sanity/queries.ts header for invariant.
    `*[_type == "pack" && status == "published" && references($assetId)][0]{ _id, title, slug }`,
    { assetId },
  );

  if (!pack) return null;
  return { packId: pack._id, packTitle: pack.title, packSlug: pack.slug.current };
}
