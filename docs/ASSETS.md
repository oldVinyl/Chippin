# Artwork

All supplied artwork is currently **PLACEHOLDER**. These are original SVG drawings created for this repository, with raster variants rendered from those drawings. They may be used under this repository’s MIT license. Replace files at the exact paths below; the app uses `apps/web/src/assets/manifest.ts`.

| Path under `apps/web/public/images/` | Dimensions / format                     | Maximum size | Status      |
| ------------------------------------ | --------------------------------------- | ------------ | ----------- |
| brand/logo.svg                       | 400 × 120 SVG                           | 200 KB       | PLACEHOLDER |
| brand/logo-mark.svg                  | 200 × 200 SVG                           | 200 KB       | PLACEHOLDER |
| brand/favicon.svg                    | 200 × 200 SVG                           | 200 KB       | PLACEHOLDER |
| brand/favicon-32.png                 | 32 × 32 PNG                             | 500 KB       | PLACEHOLDER |
| brand/apple-touch-icon-180.png       | 180 × 180 PNG                           | 500 KB       | PLACEHOLDER |
| brand/icon-192.png                   | 192 × 192 PNG                           | 500 KB       | PLACEHOLDER |
| brand/icon-512.png                   | 512 × 512 PNG                           | 500 KB       | PLACEHOLDER |
| brand/icon-maskable-512.png          | 512 × 512 PNG; drawing inside safe area | 500 KB       | PLACEHOLDER |
| brand/og-image.png                   | 1200 × 630 PNG                          | 500 KB       | PLACEHOLDER |
| illustrations/hero.svg               | 560 × 500 SVG                           | 200 KB       | PLACEHOLDER |
| illustrations/how-1-create.svg       | 270 × 230 SVG                           | 200 KB       | PLACEHOLDER |
| illustrations/how-2-share.svg        | 270 × 230 SVG                           | 200 KB       | PLACEHOLDER |
| illustrations/how-3-chipin.svg       | 270 × 230 SVG                           | 200 KB       | PLACEHOLDER |
| illustrations/success.svg            | 260 × 230 SVG                           | 200 KB       | PLACEHOLDER |
| illustrations/failure.svg            | 260 × 230 SVG                           | 200 KB       | PLACEHOLDER |
| illustrations/pending.svg            | 260 × 230 SVG                           | 200 KB       | PLACEHOLDER |
| illustrations/empty-pot.svg          | 260 × 230 SVG                           | 200 KB       | PLACEHOLDER |
| illustrations/not-found.svg          | 260 × 230 SVG                           | 200 KB       | PLACEHOLDER |
| illustrations/refund.svg             | 260 × 230 SVG                           | 200 KB       | PLACEHOLDER |
| covers/cover-01.jpg                  | 1200 × 630 JPG; memorial, calm          | 200 KB       | PLACEHOLDER |
| covers/cover-02.jpg                  | 1200 × 630 JPG; wedding                 | 200 KB       | PLACEHOLDER |
| covers/cover-03.jpg                  | 1200 × 630 JPG; baby                    | 200 KB       | PLACEHOLDER |
| covers/cover-04.jpg                  | 1200 × 630 JPG; medical, calm           | 200 KB       | PLACEHOLDER |
| covers/cover-05.jpg                  | 1200 × 630 JPG; school                  | 200 KB       | PLACEHOLDER |
| covers/cover-06.jpg                  | 1200 × 630 JPG; community               | 200 KB       | PLACEHOLDER |
| covers/cover-07.jpg                  | 1200 × 630 JPG; general                 | 200 KB       | PLACEHOLDER |
| covers/cover-08.jpg                  | 1200 × 630 JPG; celebration             | 200 KB       | PLACEHOLDER |
| patterns/blob-1.svg                  | 320 × 320 SVG                           | 200 KB       | PLACEHOLDER |
| patterns/blob-2.svg                  | 320 × 320 SVG                           | 200 KB       | PLACEHOLDER |
| patterns/blob-3.svg                  | 320 × 320 SVG                           | 200 KB       | PLACEHOLDER |

`pnpm assets:check` verifies presence, format, raster dimensions and size. SVGs include intrinsic dimensions and viewBox. `node scripts/generate-assets.mjs` regenerates the originals and overwrites replacements; use it only intentionally. Next Image optimizes covers at request time. Decorative SVGs have empty alt text; the hero has a meaningful description.

Replacement action steps are in [MANUAL_TASKS.md](MANUAL_TASKS.md).
