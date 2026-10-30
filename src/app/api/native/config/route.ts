// GET /api/native/config — settings the iOS app reads at launch, before
// sign-in (docs/hearth-native-ios-plan-v2.md §4). Public; no family data.

import { NextResponse } from 'next/server';
import { routeHandler } from '@/lib/api-helpers';
import { minSupportedBuild } from '@/lib/platform/native-config';

export const GET = routeHandler(async () => {
  return NextResponse.json(
    { minSupportedBuild: minSupportedBuild() },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}, { route: 'GET /api/native/config' });
