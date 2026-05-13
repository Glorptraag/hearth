import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { synthesizeJa } from '@/lib/ai/tts';

async function main() {
  const text = process.argv[2] ?? 'カタカナのテストです';
  const outDir = resolve(process.cwd(), 'tmp');
  const outPath = resolve(outDir, 'tts-smoke.mp3');

  console.log(`Synthesizing: ${text}`);
  const mp3 = await synthesizeJa(text);
  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, mp3);
  console.log(`Wrote ${mp3.length} bytes to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
