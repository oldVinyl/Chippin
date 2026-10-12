import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(
  new URL('../apps/web/package.json', import.meta.url),
);
const sharp = require('sharp');
const base = 'apps/web/public/images/';
function svg(body, w = 400, h = 400) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}
function save(path, data) {
  const full = base + path;
  mkdirSync(full.slice(0, full.lastIndexOf('/')), { recursive: true });
  writeFileSync(full, data);
}
const cookie = `<path d="M114 28C56 8 8 58 20 112c-14 47 35 84 80 73 46 8 88-31 78-76 15-40-12-71-39-76-8 8-18 5-25-5Z" fill="#e8d1a7" stroke="#84592b" stroke-width="5"/><g fill="#743014"><path d="m60 45 15-5 7 15-15 8-10-9Z"/><path d="m130 55 13 8-5 16-17-7Z"/><path d="m48 110 14-4 8 15-17 7Z"/><path d="m112 147 15-6 8 13-16 9Z"/><path d="m145 112 13 4-2 17-15-6Z"/></g><g fill="#442d1c"><ellipse cx="83" cy="94" rx="5" ry="7"/><ellipse cx="117" cy="94" rx="5" ry="7"/></g><path d="M86 116q14 14 28-1" fill="none" stroke="#442d1c" stroke-width="4" stroke-linecap="round"/><g fill="#c58b68" opacity=".6"><ellipse cx="68" cy="108" rx="9" ry="5"/><ellipse cx="130" cy="108" rx="9" ry="5"/></g>`;
const mark = svg(`<g transform="translate(0 0)">${cookie}</g>`, 200, 200);
save('brand/logo-mark.svg', mark);
save('brand/favicon.svg', mark);
save(
  'brand/logo.svg',
  svg(
    `<g transform="scale(.6)">${cookie}</g><text x="128" y="88" font-family="sans-serif" font-size="64" font-weight="700" fill="#442d1c">chippin.</text>`,
    400,
    120,
  ),
);
const hero = svg(
  `<path d="M71 110C114 21 280 20 363 64c75 40 154 74 154 194 0 97-48 185-184 193-132 8-261-10-289-127-14-64 2-139 27-214Z" fill="#f4e7cf"/><ellipse cx="281" cy="438" rx="199" ry="22" fill="#e8d1a7" opacity=".5"/><g transform="translate(176 65) rotate(-12 100 100) scale(1.23)">${cookie}</g><path d="M211 253q-46 22-66 6M388 251q47-33 69-6" fill="none" stroke="#442d1c" stroke-width="9" stroke-linecap="round"/><path d="m135 276 293 0-24 101c-12 53-225 63-241 0Z" fill="#743014"/><ellipse cx="282" cy="278" rx="149" ry="38" fill="#84592b"/><ellipse cx="282" cy="276" rx="125" ry="25" fill="#442d1c"/><ellipse cx="282" cy="385" rx="93" ry="24" fill="#743014"/><path d="M164 305q-55-20-63 13 0 31 54 36M414 305q59-25 64 9 4 30-57 36" fill="none" stroke="#743014" stroke-width="16"/><path d="M236 327q14-19 27 0 15-19 29 0 4 14-29 34-30-20-27-34Z" fill="#e8d1a7"/><path d="M151 116q-15-22-27-3-17-10-23 6-2 18 34 34Z" fill="#9d9167" transform="rotate(-10 120 130)"/><path d="M443 121q10-21 24-8 13-14 24 3 5 15-22 36Z" fill="#743014"/><path d="M77 262q6-16 17-7 12-13 21 2 3 13-20 29Z" fill="#c99071"/><g fill="none" stroke="#9d9167" stroke-width="3" stroke-linecap="round"><path d="M119 196h15m-8-8v16M456 347h18m-9-9v18M402 50h13m-6-7v14"/></g><g transform="translate(259 245) rotate(15)"><circle r="16" fill="#e8d1a7"/><text x="-7" y="7" font-family="sans-serif" font-size="20" fill="#442d1c">₵</text></g>`,
  560,
  500,
);
save('illustrations/hero.svg', hero);
const steps = [
  `<path d="M105 46h117v153H105Z" fill="#fffaf1"/><path d="M102 40h122v160H102Z" fill="none" stroke="#84592b" stroke-width="5" stroke-linejoin="round"/><path d="M127 72h72M127 92h48M127 135h72M127 155h62" stroke="#9d9167" stroke-width="6" stroke-linecap="round"/><path d="m194 116 36-38 12 12-38 37-16 5Z" fill="#743014"/><g transform="translate(16 89) scale(.5)">${cookie}</g>`,
  `<rect x="89" y="25" width="104" height="178" rx="18" fill="#743014"/><rect x="98" y="43" width="86" height="141" rx="8" fill="#fffaf1"/><path d="M117 114h48l-9 36h-30Z" fill="#e8d1a7"/><path d="m201 58 32 20-32 20m-4-20h34" stroke="#84592b" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M52 66q-10-14-20-2-13-7-15 8 0 11 26 23Z" fill="#9d9167"/><g transform="translate(182 130) scale(.4)">${cookie}</g>`,
  `<path d="M56 134h157l-15 59c-10 23-115 23-127 0Z" fill="#743014"/><ellipse cx="134" cy="134" rx="79" ry="20" fill="#84592b"/><ellipse cx="134" cy="134" rx="62" ry="13" fill="#442d1c"/><circle cx="139" cy="90" r="22" fill="#e8d1a7"/><text x="130" y="98" font-family="sans-serif" font-size="25" fill="#442d1c">₵</text><path d="M133 28v24m-25-15 10 17m39-17-9 16" stroke="#9d9167" stroke-width="4" stroke-linecap="round"/><g transform="translate(184 49) scale(.35)">${cookie}</g>`,
];
for (let i = 0; i < 3; i++)
  save(
    `illustrations/how-${i + 1}-${['create', 'share', 'chipin'][i]}.svg`,
    svg(
      `<ellipse cx="135" cy="130" rx="113" ry="90" fill="#f4e7cf"/>${steps[i]}`,
      270,
      230,
    ),
  );
for (const state of [
  'success',
  'failure',
  'pending',
  'empty-pot',
  'not-found',
  'refund',
]) {
  const sign =
    state === 'success'
      ? '<path d="m152 143 14 14 27-32" stroke="#743014" stroke-width="9" fill="none" stroke-linecap="round"/>'
      : state === 'pending'
        ? '<circle cx="171" cy="145" r="25" fill="#e8eadb"/><path d="M171 129v18l12 7" stroke="#442d1c" stroke-width="4" fill="none"/>'
        : '<path d="M151 145h36" stroke="#743014" stroke-width="6" stroke-linecap="round"/>';
  save(
    `illustrations/${state}.svg`,
    svg(
      `<ellipse cx="130" cy="128" rx="113" ry="87" fill="#f4e7cf"/><g transform="translate(49 25) scale(.8)">${cookie}</g>${sign}`,
      260,
      230,
    ),
  );
}
for (let i = 1; i <= 3; i++)
  save(
    `patterns/blob-${i}.svg`,
    svg(
      `<path d="M30 123C-8 21 139-13 213 42c112-1 152 160 41 190-51 92-180 80-207-14Z" fill="${['#e8d1a7', '#e8eadb', '#f4e7cf'][i - 1]}"/>`,
      320,
      320,
    ),
  );
const themes = [
  'A life remembered',
  'A day for love',
  'Welcome, little one',
  'A hand to hold',
  'Room to learn',
  'Growing together',
  'Little acts of care',
  'Something to celebrate',
];
for (let i = 1; i <= 8; i++) {
  const bg = [
    '#e8eadb',
    '#f2ddd0',
    '#f4e7cf',
    '#e8eadb',
    '#dfe7ce',
    '#e8d1a7',
    '#f4e7cf',
    '#efddc5',
  ][i - 1];
  const scene =
    i === 5
      ? '<path d="M375 220h450v280H375Z" fill="#fffaf1"/><path d="m350 230 250-140 250 140Z" fill="#84592b"/><path d="M555 355h90v145" fill="#743014"/><g fill="#9d9167"><path d="M405 280h90v80h-90ZM705 280h90v80h-90Z"/></g>'
      : i === 1 || i === 4
        ? '<path d="M610 500V180" stroke="#84592b" stroke-width="7"/><g fill="#9d9167"><ellipse cx="560" cy="235" rx="60" ry="22" transform="rotate(30 560 235)"/><ellipse cx="660" cy="290" rx="70" ry="25" transform="rotate(-30 660 290)"/><ellipse cx="557" cy="368" rx="65" ry="24" transform="rotate(30 557 368)"/></g><circle cx="610" cy="150" r="42" fill="#fffaf1"/>'
        : '<g fill="#84592b"><path d="M460 245q70-100 140-10 90-90 150 0 50 95-150 210-180-110-140-200Z"/></g><path d="M598 410V265M570 292l28-27 29 27" fill="none" stroke="#e8d1a7" stroke-width="7"/>';
  const cover = svg(
    `<path fill="${bg}" d="M0 0h1200v630H0Z"/><circle cx="910" cy="102" r="72" fill="#fffaf1" opacity=".7"/><path d="M0 508q220-120 460 0 340-150 740-15v137H0Z" fill="#9d9167" opacity=".35"/>${scene}<g fill="#84592b" opacity=".35"><path d="M160 480V305h8v175Z"/><ellipse cx="165" cy="299" rx="59" ry="74"/><path d="M1020 490V337h7v153Z"/><ellipse cx="1024" cy="329" rx="51" ry="65"/></g><text x="600" y="573" text-anchor="middle" font-family="sans-serif" font-size="27" fill="#442d1c" letter-spacing="3">${themes[i - 1]}</text>`,
    1200,
    630,
  );
  save(
    `covers/cover-${String(i).padStart(2, '0')}.jpg`,
    await sharp(Buffer.from(cover)).jpeg({ quality: 85 }).toBuffer(),
  );
}
for (const [name, size] of [
  ['favicon-32', 32],
  ['apple-touch-icon-180', 180],
  ['icon-192', 192],
  ['icon-512', 512],
  ['icon-maskable-512', 512],
]) {
  const image = name.includes('maskable')
    ? svg(
        `<path fill="#fffaf1" d="M0 0h512v512H0Z"/><g transform="translate(106 106) scale(1.5)">${cookie}</g>`,
        512,
        512,
      )
    : mark;
  save(
    `brand/${name}.png`,
    await sharp(Buffer.from(image)).resize(size, size).png().toBuffer(),
  );
}
save(
  'brand/og-image.png',
  await sharp(
    Buffer.from(
      svg(
        `<path fill="#fffaf1" d="M0 0h1200v630H0Z"/><text x="80" y="180" fill="#743014" font-family="sans-serif" font-weight="bold" font-size="58">chippin.</text><text x="80" y="310" fill="#442d1c" font-family="sans-serif" font-size="55">Good things happen</text><text x="80" y="380" fill="#442d1c" font-family="sans-serif" font-size="55">when we chip in.</text><g transform="translate(780 165) scale(1.5)">${cookie}</g>`,
        1200,
        630,
      ),
    ),
  )
    .png()
    .toBuffer(),
);
console.log('Generated original placeholder artwork and PWA icons.');
