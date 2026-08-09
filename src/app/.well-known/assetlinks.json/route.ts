import { NextResponse } from 'next/server';
import { NATIVE_APP_ID } from '@/lib/platform/native';

// Android App Links manifest — the Play-side twin of
// apple-app-site-association. Verified against the signing cert, so it is
// gated on ANDROID_CERT_SHA256 (comma-separated SHA-256 fingerprints —
// typically the Play App Signing cert plus the upload cert). 404 until the
// Play Console exists and provides them.

export async function GET() {
  const fingerprints = process.env.ANDROID_CERT_SHA256?.split(',')
    .map((f) => f.trim())
    .filter(Boolean);
  if (!fingerprints?.length) {
    return NextResponse.json({ error: 'Not configured' }, { status: 404 });
  }

  return NextResponse.json(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: NATIVE_APP_ID,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ],
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
