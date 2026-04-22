import { NextResponse } from 'next/server';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { createCommonsText, query } from '@/lib/sanity/mutations';
import { COMMONS_TEXTS_QUERY } from '@/lib/sanity/queries';

export async function GET() {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const texts = await query(COMMONS_TEXTS_QUERY);
  return NextResponse.json(texts);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const body = await req.json();
  const doc = await createCommonsText(body);

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'content.commons_text_create',
    targetResource: 'commonsText',
    targetId: doc._id,
  });

  return NextResponse.json(doc, { status: 201 });
}
