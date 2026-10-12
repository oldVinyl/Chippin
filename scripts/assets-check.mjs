import { existsSync, statSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(
  new URL('../apps/web/package.json', import.meta.url),
);
const sharp = require('sharp');
const svgFiles = [
  'brand/logo',
  'brand/logo-mark',
  'brand/favicon',
  'illustrations/hero',
  ...[
    'how-1-create',
    'how-2-share',
    'how-3-chipin',
    'success',
    'failure',
    'pending',
    'empty-pot',
    'not-found',
    'refund',
  ].map((x) => `illustrations/${x}`),
  ...['blob-1', 'blob-2', 'blob-3'].map((x) => `patterns/${x}`),
];
const raster = [
  ['brand/og-image.png', 1200, 630],
  ...[
    [32, 'favicon-32'],
    [180, 'apple-touch-icon-180'],
    [192, 'icon-192'],
    [512, 'icon-512'],
    [512, 'icon-maskable-512'],
  ].map(([size, name]) => [`brand/${name}.png`, size, size]),
  ...Array.from({ length: 8 }, (_, i) => [
    `covers/cover-${String(i + 1).padStart(2, '0')}.jpg`,
    1200,
    630,
  ]),
];
for (const name of svgFiles) {
  const file = `apps/web/public/images/${name}.svg`;
  if (
    !existsSync(file) ||
    !readFileSync(file, 'utf8').includes('<svg') ||
    statSync(file).size > 200000
  )
    throw new Error(`Invalid SVG: ${file}`);
  const meta = await sharp(file).metadata();
  const dimensions =
    name === 'brand/logo'
      ? [400, 120]
      : name === 'illustrations/hero'
        ? [560, 500]
        : name.startsWith('brand/')
          ? [200, 200]
          : name.startsWith('patterns/')
            ? [320, 320]
            : name.includes('how-')
              ? [270, 230]
              : [260, 230];
  if (
    meta.format !== 'svg' ||
    meta.width !== dimensions[0] ||
    meta.height !== dimensions[1]
  )
    throw new Error(`Invalid SVG dimensions: ${file}`);
}
for (const [name, w, h] of raster) {
  const file = `apps/web/public/images/${name}`;
  const meta = await sharp(file).metadata();
  if (
    meta.width !== w ||
    meta.height !== h ||
    !['png', 'jpeg'].includes(meta.format) ||
    statSync(file).size > (name.endsWith('.jpg') ? 200000 : 500000)
  )
    throw new Error(`Invalid dimensions/format/size: ${file}`);
}
console.log(
  `All ${svgFiles.length + raster.length} assets present with expected format, size and dimensions.`,
);
