// Generates the PWA / store icon set from the single source mark.
//
// The source (public/hearth_pwa_icon.png) is 507x512 with an alpha channel.
// Both are problems: the manifest declared it as 512x512 (a lie Lighthouse
// flags), and App Store icons are rejected outright if they carry alpha.
// Everything this script emits is square and fully opaque.
//
// Maskable variants scale the mark to 80% on a filled canvas so the mark
// survives Android's circle/squircle crop — the source art runs to the edge
// and would be clipped.
//
// Run: node scripts/generate-app-icons.mjs

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const SOURCE = 'public/hearth_pwa_icon.png';
const OUT_DIR = 'public/icons';

// Sampled from the source art's corners — the paper-texture cream it sits on.
const CANVAS = { r: 250, g: 249, b: 247 };

// Maskable safe zone: content must fit the centre 80%.
const MASKABLE_SCALE = 0.8;

/** Square + opaque at `size`, mark filling the canvas. */
async function plain(size) {
  return sharp(SOURCE)
    .resize(size, size, { fit: 'contain', background: CANVAS })
    .flatten({ background: CANVAS })
    .png()
    .toBuffer();
}

/** Square + opaque at `size`, mark inset to the maskable safe zone. */
async function maskable(size) {
  const inner = Math.round(size * MASKABLE_SCALE);
  const mark = await sharp(SOURCE)
    .resize(inner, inner, { fit: 'contain', background: CANVAS })
    .toBuffer();

  const composited = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: CANVAS,
    },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toBuffer();

  // Composite re-introduces alpha from the mark, and sharp orders flatten
  // before composite internally regardless of call order — so stripping it
  // needs its own pass. A transparent maskable icon gets filled with black
  // by some Android launchers.
  return sharp(composited).removeAlpha().png().toBuffer();
}

/**
 * Wraps a PNG in an ICO container. Sharp cannot write .ico, but the Vista-era
 * format embeds a PNG verbatim behind a 22-byte header, so this is exact
 * rather than a re-encode. src/app/layout.tsx references /favicon.ico.
 */
function icoFromPng(png, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  // 256px is encoded as 0 in a single byte; we only emit 32px but keep the
  // conversion honest in case the size changes.
  header.writeUInt8(size >= 256 ? 0 : size, 6); // width
  header.writeUInt8(size >= 256 ? 0 : size, 7); // height
  header.writeUInt8(0, 8); // palette size (0 = truecolour)
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14); // payload size
  header.writeUInt32LE(22, 18); // payload offset
  return Buffer.concat([header, png]);
}

const TARGETS = [
  // PWA manifest — `any` purpose.
  { path: `${OUT_DIR}/icon-192.png`, make: () => plain(192) },
  { path: `${OUT_DIR}/icon-512.png`, make: () => plain(512) },
  // App Store / Play listing + TWA generation. Must be opaque.
  { path: `${OUT_DIR}/icon-1024.png`, make: () => plain(1024) },
  // PWA manifest — `maskable` purpose.
  { path: `${OUT_DIR}/maskable-192.png`, make: () => maskable(192) },
  { path: `${OUT_DIR}/maskable-512.png`, make: () => maskable(512) },
  // Referenced by metadata.icons in src/app/layout.tsx.
  { path: 'public/icon.png', make: () => plain(192) },
  { path: 'public/apple-touch-icon.png', make: () => plain(180) },
  { path: 'public/apple-touch-icon-precomposed.png', make: () => plain(180) },
];

await mkdir(OUT_DIR, { recursive: true });

for (const { path, make } of TARGETS) {
  const buf = await make();
  await sharp(buf).toFile(path);
  const { width, height, hasAlpha } = await sharp(path).metadata();
  console.log(`${path.padEnd(38)} ${width}x${height} alpha=${hasAlpha}`);
}

const favicon = icoFromPng(await plain(32), 32);
await writeFile('public/favicon.ico', favicon);
console.log(`${'public/favicon.ico'.padEnd(38)} 32x32 (${favicon.length} bytes)`);

console.log(`\n${TARGETS.length + 1} icons written.`);
