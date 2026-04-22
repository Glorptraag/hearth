import { NextResponse } from 'next/server';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { sanityWriteClient } from '@/lib/sanity/client';
import { createAsset } from '@/lib/sanity/mutations';
import { query } from '@/lib/sanity/mutations';
import { ASSETS_QUERY } from '@/lib/sanity/queries';

export async function GET() {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const assets = await query(ASSETS_QUERY);
  return NextResponse.json(assets);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const metadataStr = formData.get('metadata') as string | null;

    if (!metadataStr) {
      return NextResponse.json({ error: 'Metadata required' }, { status: 400 });
    }

    const metadata = JSON.parse(metadataStr);

    let fileRef: string | undefined;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await sanityWriteClient.assets.upload('file', buffer, {
        filename: file.name,
        contentType: file.type,
      });
      fileRef = uploaded._id;
    }

    let thumbnailRef: string | undefined;
    if (thumbnailFile) {
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      const uploaded = await sanityWriteClient.assets.upload('image', buffer, {
        filename: thumbnailFile.name,
        contentType: thumbnailFile.type,
      });
      thumbnailRef = uploaded._id;
    }

    const doc = await createAsset({
      ...metadata,
      fileRef,
      thumbnailRef,
    });

    await logAdminAction({
      adminUserId: admin.userId,
      adminEmail: admin.email,
      action: 'content.asset_create',
      targetResource: 'asset',
      targetId: doc._id,
    });

    return NextResponse.json(doc, { status: 201 });
  }

  const body = await req.json();
  const doc = await createAsset(body);

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'content.asset_create',
    targetResource: 'asset',
    targetId: doc._id,
  });

  return NextResponse.json(doc, { status: 201 });
}
