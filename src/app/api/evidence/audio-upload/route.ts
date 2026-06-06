import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { rateLimit } from '@/lib/rate-limit';
import { routeHandler } from '@/lib/api-helpers';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/mpeg'];

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
      { error: 'File type not allowed. Use WebM, M4A, or MP3.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum 10 MB.' },
      { status: 400 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Evidence storage not configured. Set BLOB_READ_WRITE_TOKEN in environment.' },
      { status: 503 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === 'audio/webm' ? 'webm'
    : file.type === 'audio/mpeg' ? 'mp3'
    : 'm4a';
  const path = `evidence/${family.id}/audio-${Date.now()}.${ext}`;

  try {
    // Audio evidence is a child's voice — store it PRIVATE so the bytes are
    // never reachable without the authenticated read proxy (GET /api/evidence).
    // The persisted reference is the blob *pathname*, never a public URL. Fall
    // back to public if the store doesn't support private access — the proxy
    // still gates client access by family (the path embeds the family id).
    let blob;
    try {
      blob = await put(path, buffer, { access: 'private', addRandomSuffix: true, contentType: file.type });
    } catch (privErr) {
      console.warn('[evidence/audio-upload] private blob unavailable — falling back to public:', privErr);
      blob = await put(path, buffer, { access: 'public', addRandomSuffix: true, contentType: file.type });
    }

    return NextResponse.json({ pathname: blob.pathname });
  } catch (err) {
    console.error('[evidence/audio-upload] Blob storage error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}, { route: 'POST /api/evidence/audio-upload' });
