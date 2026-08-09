import { NextResponse } from 'next/server';
import { NATIVE_APP_ID } from '@/lib/platform/native';

// Apple universal-links manifest. iOS fetches this (extensionless, JSON) to
// let the native app catch https://hearth-lms.com links — which is how the
// Clerk OAuth flow returns from ASWebAuthenticationSession to the app.
// See docs/hearth-native-app-plan-v1.md (Phase 2, Auth).
//
// Gated on APPLE_TEAM_ID: until Drew's Apple Developer enrolment (D-U-N-S
// pending) provides a Team ID, there is no valid appID to declare and Apple's
// CDN caching a placeholder would be worse than a 404.

export async function GET() {
  const teamId = process.env.APPLE_TEAM_ID;
  if (!teamId) {
    return NextResponse.json({ error: 'Not configured' }, { status: 404 });
  }

  const appId = `${teamId}.${NATIVE_APP_ID}`;
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [{ appID: appId, paths: ['*'] }],
      },
      webcredentials: {
        apps: [appId],
      },
    },
    {
      headers: {
        // Apple's CDN refetches periodically; an hour keeps rotation cheap
        // without hammering the function.
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
