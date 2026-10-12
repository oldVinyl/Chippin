export const terms = {
  pot: 'Pot',
  pots: 'Pots',
  potLower: 'pot',
  potsLower: 'pots',
  contribution: 'Contribution',
  contributor: 'Contributor',
  donorBook: 'Donor book',
  chipIn: 'Chip In',
  organizer: 'Organizer',
  payout: 'Payout',
  refund: 'Refund',
} as const;
export const credit = {
  organization: 'Vinet',
  creator: 'Vinyl',
  url: 'https://github.com/oldVinyl',
} as const;
const modeEnglish = {
  ON_CLOSE: 'Funds are released when the organizer closes this pot.',
  SCHEDULED: 'Funds are released at the time chosen by the organizer.',
  INSTANT: 'Funds are released as contributions arrive.',
} as const;
export const modeCopy = copyTerms(modeEnglish);
export function nounCopy(value: string): string {
  const replacements: Record<string, string> = {
    pot: terms.potLower,
    pots: terms.potsLower,
    organizer: terms.organizer.toLowerCase(),
    contributor: terms.contributor.toLowerCase(),
    contribution: terms.contribution.toLowerCase(),
    payout: terms.payout.toLowerCase(),
    refund: terms.refund.toLowerCase(),
    'donor book': terms.donorBook.toLowerCase(),
  };
  return value.replace(
    /\b(donor book|pots|pot|organizer|contributor|contribution|payout|refund)\b/gi,
    (word) => {
      const next = replacements[word.toLowerCase()];
      return word[0] === word[0].toUpperCase()
        ? next[0].toUpperCase() + next.slice(1)
        : next;
    },
  );
}
export function copyTerms<T>(value: T): T {
  if (typeof value === 'string') return nounCopy(value) as T;
  if (Array.isArray(value)) return value.map(copyTerms) as T;
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, text]) => [key, copyTerms(text)]),
    ) as T;
  return value;
}
