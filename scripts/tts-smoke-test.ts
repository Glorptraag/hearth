import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { synthesizeSpeech } from '@/lib/ai/tts';

// Quick check that DEEPGRAM_API_KEY works and Aura returns playable audio.
// Usage: tsx scripts/tts-smoke-test.ts "Some text to read aloud"
async function main() {
  const text = process.argv[2] ?? 'Slow and steady wins the race.';
  const outDir = resolve(process.cwd(), 'tmp');
  const outPath = resolve(outDir, 'tts-smoke.mp3');

  console.log(`Synthesizing: ${text}`);
  const { audio, model } = await synthesizeSpeech(text);
  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, audio);
  console.log(`Wrote ${audio.length} bytes (${model}) to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
