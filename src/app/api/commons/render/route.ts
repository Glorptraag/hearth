import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFamily, apiError } from '@/lib/api-helpers';
import { canAccessCommonsText } from '@/lib/entitlements';
import { sanityClient } from '@/lib/sanity/client';
import { COMMONS_TEXT_DETAIL_QUERY } from '@/lib/sanity/queries';
import { renderCommonsTextToPdf } from '@/lib/pdf/renderCommons';

/**
 * GET /api/commons/render?id=X
 *
 * Renders a commons text to PDF and returns it for download/print.
 * Entitlement-gated.
 */
export async function GET(request: NextRequest) {
  const result = await authenticatedFamily({ rateLimitKey: 'commons-render', rateLimit: 20 });
  if ('error' in result) return result.error;

  const textId = request.nextUrl.searchParams.get('id');
  if (!textId) return apiError('Missing id parameter', 400);

  // Entitlement check
  const hasAccess = await canAccessCommonsText(result.family.id, textId);
  if (!hasAccess) {
    return NextResponse.json(
      {
        error: 'not_entitled',
        message: 'You do not have access to this text.',
      },
      { status: 403 },
    );
  }

  // Fetch the commons text
  const text = await sanityClient.fetch<{
    _id: string;
    title: string;
    kind?: string;
    tradition?: string;
    body?: unknown[];
    slug?: { current: string };
    source?: string;
  }>(COMMONS_TEXT_DETAIL_QUERY, { id: textId });

  if (!text?.body || text.body.length === 0) {
    return apiError('Commons text body is empty', 404);
  }

  // Render to PDF
  const pdfBytes = await renderCommonsTextToPdf({
    title: text.title,
    kind: text.kind,
    tradition: text.tradition,
    body: text.body,
    source: text.source,
  });

  const slug = text.slug?.current ?? 'reading';
  const filename = `hearth-${slug}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=86400', // 1 day — commons texts rarely change
    },
  });
}
