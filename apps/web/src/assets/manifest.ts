export const assets = {
  logo: '/images/brand/logo.svg',
  mark: '/images/brand/logo-mark.svg',
  hero: '/images/illustrations/hero.svg',
  create: '/images/illustrations/how-1-create.svg',
  share: '/images/illustrations/how-2-share.svg',
  chipin: '/images/illustrations/how-3-chipin.svg',
  success: '/images/illustrations/success.svg',
  failure: '/images/illustrations/failure.svg',
  pending: '/images/illustrations/pending.svg',
  empty: '/images/illustrations/empty-pot.svg',
  notFound: '/images/illustrations/not-found.svg',
  refund: '/images/illustrations/refund.svg',
  covers: Array.from(
    { length: 8 },
    (_, i) => `/images/covers/cover-${String(i + 1).padStart(2, '0')}.jpg`,
  ),
} as const;
