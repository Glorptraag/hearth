import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { routeHandler } from '@/lib/api-helpers';
import { sanityServerClient } from '@/lib/sanity/client';
import { MODULE_DETAIL_QUERY } from '@/lib/sanity/queries';

/**
 * GET /api/modules/[id]/detail
 *
 * Authed server proxy for MODULE_DETAIL_QUERY. The module runner page
 * (src/app/(auth)/module/[id]/page.tsx) is a client component, so reading this
 * query straight from the browser goes through the tokenless `sanityClient` —
 * which can't see the dotted-id `commonsText` / `asset` docs the query derefs
 * (read-aloud text + audio URL). Sanity's public dataset ACL grants anonymous
 * read only to single-segment ids, so those derefs come back empty in prod and
 * the CommonsReader + Listen button render nothing. Broadening the ACL isn't
 * available on this plan (see memory project_sanity_public_acl_dotted_id), so
 * we read through the authed `sanityServerClient` here instead. The projection
 * is identical to the client query, so nothing new is exposed to the browser —
 * the dotted-id derefs simply resolve.
 */
type Params = { params: Promise<{ id: string }> };

export const GET = routeHandler(async (_request: NextRequest, { params }: Params) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const moduleDoc = await sanityServerClient.fetch(MODULE_DETAIL_QUERY, { id });
  return NextResponse.json(moduleDoc ?? null);
}, { route: 'GET /api/modules/[id]/detail' });
