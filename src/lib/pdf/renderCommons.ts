import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Extract plain text from Sanity Portable Text blocks.
 * Handles nested children spans and paragraph breaks.
 */
function portableTextToPlain(blocks: unknown[]): string {
  if (!Array.isArray(blocks)) return '';

  return blocks
    .filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null)
    .map((block) => {
      if (block._type !== 'block') return '';
      const children = block.children as Array<{ text?: string }> | undefined;
      if (!children) return '';
      return children.map((c) => c.text ?? '').join('');
    })
    .join('\n\n');
}

/**
 * Render a commons text document to a PDF using pdf-lib.
 *
 * Layout: A4 portrait, 25mm margins, Helvetica (serif substitute in pdf-lib),
 * title page with metadata, then body text across pages.
 */
export async function renderCommonsTextToPdf(input: {
  title: string;
  kind?: string;
  tradition?: string;
  body: unknown[];
  source?: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont('Helvetica' as Parameters<typeof doc.embedFont>[0]);
  const boldFont = await doc.embedFont('Helvetica-Bold' as Parameters<typeof doc.embedFont>[0]);

  const PAGE_WIDTH = 595.28; // A4
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 71; // ~25mm
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const BODY_SIZE = 12; // ~14pt equivalent at screen resolution
  const LINE_HEIGHT = BODY_SIZE * 1.5;
  const TITLE_SIZE = 24;
  const META_SIZE = 10;
  const FOOTER_SIZE = 8;

  const bodyText = portableTextToPlain(input.body);
  const paragraphs = bodyText.split('\n\n').filter(Boolean);

  // Wrap text into lines that fit the content width
  function wrapText(text: string, size: number, f: typeof font): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = f.widthOfTextAtSize(testLine, size);
      if (testWidth > CONTENT_WIDTH && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Collect all lines: title block + body paragraphs
  interface LineEntry {
    text: string;
    size: number;
    font: typeof font;
    spacingAfter: number;
  }

  const allLines: LineEntry[] = [];

  // Title
  const titleLines = wrapText(input.title, TITLE_SIZE, boldFont);
  for (const line of titleLines) {
    allLines.push({ text: line, size: TITLE_SIZE, font: boldFont, spacingAfter: TITLE_SIZE * 1.3 });
  }

  // Meta line
  const metaParts = [input.kind?.replace(/_/g, ' '), input.tradition].filter(Boolean);
  if (metaParts.length > 0) {
    allLines.push({ text: metaParts.join(' · '), size: META_SIZE, font, spacingAfter: META_SIZE * 2 });
  }

  // Spacer
  allLines.push({ text: '', size: BODY_SIZE, font, spacingAfter: LINE_HEIGHT });

  // Body paragraphs
  for (const para of paragraphs) {
    const lines = wrapText(para, BODY_SIZE, font);
    for (const line of lines) {
      allLines.push({ text: line, size: BODY_SIZE, font, spacingAfter: LINE_HEIGHT });
    }
    // Extra spacing between paragraphs
    allLines.push({ text: '', size: BODY_SIZE, font, spacingAfter: LINE_HEIGHT * 0.5 });
  }

  // Source attribution
  if (input.source) {
    allLines.push({ text: '', size: BODY_SIZE, font, spacingAfter: LINE_HEIGHT });
    const sourceLines = wrapText(`Source: ${input.source}`, META_SIZE, font);
    for (const line of sourceLines) {
      allLines.push({ text: line, size: META_SIZE, font, spacingAfter: META_SIZE * 1.4 });
    }
  }

  // Paginate
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  for (const entry of allLines) {
    if (y - entry.spacingAfter < MARGIN + 30) {
      // Footer on current page
      page.drawText('Hearth', {
        x: MARGIN,
        y: MARGIN / 2,
        size: FOOTER_SIZE,
        font: boldFont,
        color: rgb(0.7, 0.7, 0.7),
      });

      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    if (entry.text) {
      page.drawText(entry.text, {
        x: MARGIN,
        y,
        size: entry.size,
        font: entry.font,
      });
    }
    y -= entry.spacingAfter;
  }

  // Footer on last page
  page.drawText('Hearth', {
    x: MARGIN,
    y: MARGIN / 2,
    size: FOOTER_SIZE,
    font: boldFont,
    color: rgb(0.7, 0.7, 0.7),
  });

  return doc.save();
}
