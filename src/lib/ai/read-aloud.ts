// Converts a commons-text `readAloudVersion` (or `body`) Portable Text array into
// clean narration text suitable for a TTS engine.
//
// The read-aloud version is authored for a *human* facilitator, so it carries two
// kinds of parenthetical annotation that must not be spoken verbatim:
//   1. Delivery directions — "(pause)", "(slowly)", "(pause — let this sink in)".
//      These are stripped entirely.
//   2. Pronunciation glosses for archaic words — "maketh (makes)", "thou (you)".
//      The archaic word is replaced by its modern gloss so the narration sounds
//      natural rather than stilted.
//
// All functions here are pure — no Sanity, no network — so the write-time pipeline
// can unit-test cue handling deterministically.

interface PortableTextSpan {
  _type?: string;
  text?: string;
}

interface PortableTextBlock {
  _type?: string;
  children?: PortableTextSpan[];
  text?: string;
}

/** Flatten a Portable Text block array to plain text, paragraphs separated by blank lines. */
export function portableTextToPlainText(blocks: unknown[] | undefined | null): string {
  if (!Array.isArray(blocks)) return '';
  const paragraphs: string[] = [];
  for (const raw of blocks) {
    const block = raw as PortableTextBlock;
    if (!block || typeof block !== 'object') continue;
    if (Array.isArray(block.children)) {
      const text = block.children
        .map((c) => (typeof c?.text === 'string' ? c.text : ''))
        .join('');
      if (text.trim()) paragraphs.push(text);
    } else if (typeof block.text === 'string' && block.text.trim()) {
      // Tolerate the `blockText()` shorthand shape used by some seed paths.
      paragraphs.push(block.text);
    }
  }
  return paragraphs.join('\n\n');
}

// A parenthetical is a delivery direction (stripped) rather than a gloss (kept &
// substituted) if it reads like a stage cue.
const DIRECTION_RE =
  /^(pause|slow|soft|quiet|whisper|beat|breath|bright|gentl|warml|sadl|excit|sigh|emphas|with\b|let\b|read|continue)/i;

function isStageDirection(inner: string): boolean {
  const t = inner.trim();
  if (!t) return true;
  if (t.includes('—') || t.includes(' - ')) return true; // "(pause — let this sink in)"
  if (DIRECTION_RE.test(t)) return true;
  // Glosses are one or two words ("makes", "you anoint"); longer = a direction.
  if (t.split(/\s+/).length > 2) return true;
  return false;
}

/** Normalise plain read-aloud text for TTS: strip directions, apply glosses, tidy whitespace. */
export function toNarrationText(input: string): string {
  if (!input) return '';
  // 1. Remove delivery-direction parentheticals; leave glosses for the next pass.
  let out = input.replace(/\s*\(([^)]*)\)/g, (full, inner: string) =>
    isStageDirection(inner) ? '' : full
  );
  // 2. Gloss substitution: a word immediately followed by "(gloss)" → the gloss.
  out = out.replace(/[\w’']+\s*\(([^)]+)\)/g, (_full, gloss: string) => gloss.trim());
  // 3. Tidy: collapse spaces, fix spacing before punctuation, cap blank lines.
  out = out
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/ *\n *\n+ */g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
  return out;
}

/** Convenience: Portable Text → speakable narration string. */
export function readAloudToNarration(blocks: unknown[] | undefined | null): string {
  return toNarrationText(portableTextToPlainText(blocks));
}

/**
 * Split narration into chunks no longer than `maxChars`, preferring paragraph then
 * sentence boundaries. Deepgram Aura accepts up to ~2000 characters per request;
 * the caller synthesises each chunk and concatenates the resulting MP3 buffers.
 */
export function splitForTts(text: string, maxChars = 1900): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const chunks: string[] = [];
  let cur = '';
  const flush = () => {
    if (cur.trim()) chunks.push(cur.trim());
    cur = '';
  };

  for (const para of clean.split(/\n{2,}/)) {
    if (para.length <= maxChars) {
      if ((cur + '\n\n' + para).length > maxChars) flush();
      cur = cur ? `${cur}\n\n${para}` : para;
      continue;
    }
    // Paragraph itself is over the limit — break it on sentence boundaries.
    flush();
    const sentences = para.match(/[^.!?]+[.!?]*\s*/g) ?? [para];
    for (const sentence of sentences) {
      if (sentence.length > maxChars) {
        flush();
        for (let i = 0; i < sentence.length; i += maxChars) {
          chunks.push(sentence.slice(i, i + maxChars).trim());
        }
        continue;
      }
      if ((cur + sentence).length > maxChars) flush();
      cur += sentence;
    }
    flush();
  }
  flush();
  return chunks;
}
