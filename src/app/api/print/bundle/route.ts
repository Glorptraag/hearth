import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticatedFamily, parseBody, routeHandler } from '@/lib/api-helpers';
import { checkBulkAccess } from '@/lib/entitlements';
import { sanityClient } from '@/lib/sanity/client';
import { ASSET_DETAIL_QUERY, COMMONS_TEXT_DETAIL_QUERY } from '@/lib/sanity/queries';
import { PDFDocument } from 'pdf-lib';
import { mergePdfs, createCoverPage } from '@/lib/pdf/merge';
import { renderCommonsTextToPdf } from '@/lib/pdf/renderCommons';

const bundleSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    kind: z.enum(['asset', 'commonsText']),
  })).min(1).max(50),
  copies: z.number().int().min(1).max(20).default(1),
  combine: z.boolean().default(true),
  grouping: z.enum(['module', 'day', 'kind', 'none']).optional(),
  coverTitle: z.string().optional(),
});

/**
 * POST /api/print/bundle
 *
 * Generates a merged PDF bundle from selected assets and commons texts.
 * Streams the PDF directly in the response — no external storage.
 * Warnings are returned via X-Bundle-Warnings header (JSON-encoded).
 */
export const POST = routeHandler(async (request: NextRequest) => {
  const result = await authenticatedFamily({ rateLimitKey: 'print-bundle', rateLimit: 10, rateLimitWindow: 60_000 });
  if ('error' in result) return result.error;

  const parsed = await parseBody(request, bundleSchema);
  if ('error' in parsed) return parsed.error;
  const { items, copies, combine, coverTitle } = parsed.data;

  // Entitlement check — all items must pass
  const access = await checkBulkAccess(result.family.id, items);
  if (access.denied.length > 0) {
    return NextResponse.json(
      {
        error: 'not_entitled',
        message: `Access denied for ${access.denied.length} item(s).`,
        deniedIds: access.denied,
      },
      { status: 403 },
    );
  }

  // Fetch and render each item to PDF bytes
  const pdfBuffers: Uint8Array[] = [];
  const warnings: Array<{ itemId: string; reason: string }> = [];
  let totalPages = 0;

  for (const item of items) {
    try {
      if (item.kind === 'asset') {
        const asset = await sanityClient.fetch<{
          _id: string;
          title: string;
          fileUrl?: string;
          kind: string;
        }>(ASSET_DETAIL_QUERY, { id: item.id });

        if (!asset?.fileUrl) {
          warnings.push({ itemId: item.id, reason: 'Asset file not found' });
          continue;
        }

        // Skip audio assets from print bundles
        if (asset.kind === 'audio') {
          warnings.push({ itemId: item.id, reason: 'Audio assets cannot be included in print bundles' });
          continue;
        }

        const response = await fetch(asset.fileUrl);
        if (!response.ok) {
          warnings.push({ itemId: item.id, reason: 'Failed to fetch asset file' });
          continue;
        }

        const buffer = new Uint8Array(await response.arrayBuffer());
        try {
          const loaded = await PDFDocument.load(buffer, { ignoreEncryption: true });
          totalPages += loaded.getPageCount();
          pdfBuffers.push(buffer);
        } catch {
          warnings.push({ itemId: item.id, reason: `Non-PDF asset (${asset.kind || 'unknown'}) cannot be included in print bundles` });
          continue;
        }
      } else {
        // commonsText — render to PDF
        const text = await sanityClient.fetch<{
          _id: string;
          title: string;
          kind?: string;
          tradition?: string;
          body?: unknown[];
          source?: string;
        }>(COMMONS_TEXT_DETAIL_QUERY, { id: item.id });

        if (!text?.body || text.body.length === 0) {
          warnings.push({ itemId: item.id, reason: 'Commons text body is empty' });
          continue;
        }

        const pdfBytes = await renderCommonsTextToPdf({
          title: text.title,
          kind: text.kind,
          tradition: text.tradition,
          body: text.body,
          source: text.source,
        });
        try {
          const loaded = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
          totalPages += loaded.getPageCount();
        } catch { /* count will be approximate */ }
        pdfBuffers.push(pdfBytes);
      }
    } catch {
      warnings.push({ itemId: item.id, reason: 'Unexpected error processing item' });
    }
  }

  if (pdfBuffers.length === 0) {
    return NextResponse.json(
      {
        status: 'error' as const,
        error: 'No items could be processed. Please try again or download items individually.',
        warnings,
      },
      { status: 422 },
    );
  }

  // Optionally prepend a cover page
  if (coverTitle && combine) {
    const coverBytes = await createCoverPage(
      coverTitle,
      pdfBuffers.length,
      totalPages,
      new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
    );
    pdfBuffers.unshift(coverBytes);
  }

  // Merge all PDFs into a single document
  const mergedBytes = await mergePdfs(pdfBuffers, copies);

  // Generate filename
  const filename = coverTitle
    ? `hearth-${coverTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.pdf`
    : `hearth-materials-${new Date().toISOString().slice(0, 10)}.pdf`;

  // Stream PDF directly — no external storage
  const headers: Record<string, string> = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'private, no-store',
    'X-Bundle-Page-Count': String(totalPages * copies),
  };
  if (warnings.length > 0) {
    headers['X-Bundle-Warnings'] = JSON.stringify(warnings);
  }

  return new NextResponse(Buffer.from(mergedBytes), { status: 200, headers });
}, { route: 'POST /api/print/bundle' });
