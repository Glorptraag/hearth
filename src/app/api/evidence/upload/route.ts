import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { rateLimit } from '@/lib/rate-limit';
import sharp from 'sharp';
import { routeHandler } from '@/lib/api-helpers';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

async function compressIfImage(
  file: File
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type;
  const originalName = file.name;

  if (!contentType.startsWith('image/') || contentType === 'image/gif') {
    return { buffer, contentType, filename: originalName };
  }

  try {
    const isWebP = contentType === 'image/webp';
    const pipeline = sharp(buffer).resize({ width: 1920, withoutEnlargement: true });

    let compressed: Buffer;
    let outType: string;
    let newName: string;

    if (isWebP) {
      compressed = await pipeline.webp({ quality: 80 }).withMetadata({ exif: {} }).toBuffer();
      outType = 'image/webp';
      newName = originalName.replace(/\.[^.]+$/, '.webp');
    } else {
      compressed = await pipeline.jpeg({ quality: 80, mozjpeg: true }).withMetadata({ exif: {} }).toBuffer();
      outType = 'image/jpeg';
      newName = originalName.replace(/\.[^.]+$/, '.jpg');
    }

    return { buffer: compressed, contentType: outType, filename: newName };
  } catch {
    return { buffer, contentType, filename: originalName };
  }
}

export const POST = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = rateLimit(`upload:${userId}`, { limit: 10, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many uploads' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'File type not allowed. Use JPEG, PNG, WebP, or HEIC.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum 5 MB.' },
      { status: 400 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Graceful degradation by design (see docs/deployment-runbook.md). The dev
    // reason stays in the server log; parents see a friendly message instead.
    console.error('[evidence/upload] BLOB_READ_WRITE_TOKEN not set — photo uploads disabled in this environment');
    return NextResponse.json(
      { error: 'Photo uploads aren’t available right now. Please try again later.' },
      { status: 503 }
    );
  }

  const { buffer, contentType, filename } = await compressIfImage(file);
  const ext = filename.split('.').pop() ?? 'jpg';
  const path = `evidence/${family.id}/${Date.now()}.${ext}`;

  try {
    const blob = await put(path, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('[evidence/upload] Blob storage error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}, { route: 'POST /api/evidence/upload' });
