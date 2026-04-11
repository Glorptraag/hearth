import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Merge multiple PDF byte arrays into a single PDF document.
 * Optionally duplicates the merged pages for multiple copies.
 */
export async function mergePdfs(
  pdfBuffers: Uint8Array[],
  copies: number = 1,
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  // Copy pages from each source PDF
  for (const buffer of pdfBuffers) {
    try {
      const source = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = await merged.copyPages(source, source.getPageIndices());
      for (const page of pages) {
        merged.addPage(page);
      }
    } catch {
      // Skip invalid PDFs — the caller handles warnings
      continue;
    }
  }

  // Duplicate for copies > 1
  if (copies > 1 && merged.getPageCount() > 0) {
    const basePageCount = merged.getPageCount();
    // Save and reload to get a clean source for copying
    const baseBytes = await merged.save();
    const baseDoc = await PDFDocument.load(baseBytes);

    for (let c = 1; c < copies; c++) {
      const pages = await merged.copyPages(baseDoc, baseDoc.getPageIndices().slice(0, basePageCount));
      for (const page of pages) {
        merged.addPage(page);
      }
    }
  }

  return merged.save();
}

/**
 * Create a cover page PDF with title and summary info.
 * Returns the cover page as PDF bytes.
 */
export async function createCoverPage(
  title: string,
  itemCount: number,
  pageCount: number,
  date: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4

  const font = await doc.embedFont('Helvetica' as Parameters<typeof doc.embedFont>[0]);
  const boldFont = await doc.embedFont('Helvetica-Bold' as Parameters<typeof doc.embedFont>[0]);

  const { width, height } = page.getSize();
  const margin = 72; // 1 inch = 72 points ≈ 25mm

  // Hearth wordmark
  page.drawText('Hearth', {
    x: margin,
    y: height - margin - 24,
    size: 18,
    font: boldFont,
    color: rgb(0.85, 0.48, 0.23), // ember approx
  });

  // Title
  page.drawText(title, {
    x: margin,
    y: height - margin - 80,
    size: 28,
    font: boldFont,
    maxWidth: width - margin * 2,
  });

  // Summary
  const summary = `${itemCount} item${itemCount !== 1 ? 's' : ''} · ${pageCount} page${pageCount !== 1 ? 's' : ''}`;
  page.drawText(summary, {
    x: margin,
    y: height - margin - 120,
    size: 12,
    font,
  });

  // Date
  page.drawText(`Generated ${date}`, {
    x: margin,
    y: height - margin - 145,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return doc.save();
}
