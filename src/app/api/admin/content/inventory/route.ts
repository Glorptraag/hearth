import { NextResponse } from 'next/server';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { sanityClient } from '@/lib/sanity/client';
import { CONTENT_INVENTORY_QUERY } from '@/lib/sanity/queries';

interface InventoryNode {
  _id: string;
  status?: string;
  modules?: InventoryNode[];
  approaches?: InventoryNode[];
  activities?: InventoryNode[];
}

function countStatuses(nodes: InventoryNode[]): Record<string, number> {
  const counts: Record<string, number> = {};
  function walk(items: InventoryNode[]) {
    for (const item of items) {
      const s = item.status ?? 'unknown';
      counts[s] = (counts[s] ?? 0) + 1;
      if (item.modules) walk(item.modules);
      if (item.approaches) walk(item.approaches);
      if (item.activities) walk(item.activities);
    }
  }
  walk(nodes);
  return counts;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const packs = await sanityClient.fetch(CONTENT_INVENTORY_QUERY);
  const counts = countStatuses(packs as InventoryNode[]);

  return NextResponse.json({ packs, counts });
}
