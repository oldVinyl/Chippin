import { copyTerms } from './terms';
const english = {
  hero: {
    eyebrow: 'A LITTLE FROM EACH OF US. A LOT FOR SOMEONE.',
    title: 'Good things happen when we chip in.',
    body: 'For the big days. The hard days. And the things we can only do together. Bring your people together, one contribution at a time.',
    cta: 'Start a pot',
    secondary: 'See a pot in action',
  },
  trust: [
    'No app to download',
    'No account to contribute',
    'Every contribution counted',
  ],
  steps: [
    {
      title: 'Make it yours.',
      body: 'Tell your story, choose when funds go out, and give your pot a name.',
    },
    {
      title: 'Bring your people.',
      body: 'Share a link in the family group. Or let friends scan your QR code.',
    },
    {
      title: 'Watch kindness add up.',
      body: 'Chip in with MoMo. See every contribution and the growing total.',
    },
  ],
  faq: [
    {
      question: 'Do my friends need an account?',
      answer:
        'No. They open your link, enter an amount and a MoMo number, then approve on their phone.',
    },
    {
      question: 'When does the organizer receive the money?',
      answer:
        'The pot tells you before you pay: as contributions arrive, at a set time, or when the organizer closes it.',
    },
    {
      question: 'Can I give without showing my name?',
      answer:
        'Yes, if the organizer allows it. Your name stays out of the public donor book and exports. We keep your number private so a refund can reach you.',
    },
    {
      question: 'What if a payment takes a while?',
      answer:
        'Keep your receipt reference. We check with MoMo until the outcome is confirmed. Please avoid paying again if money already left your wallet.',
    },
    {
      question: 'Is this using real money?',
      answer:
        'This is a hackathon prototype. Mock mode moves no money. MTN sandbox uses test EUR. Live operation would be in partnership with MTN or a licensed payment provider.',
    },
  ],
  scam: 'Know who you’re giving to. Check the pot and organizer before you chip in.',
  pin: 'Your MoMo PIN belongs on your phone. Chippin will never ask for it.',
  unknown:
    'We’re checking with MoMo. If money left your wallet, it will show here automatically or be returned. Keep this reference:',
  privacy:
    'Draft policy — a Ghanaian lawyer must review this before live launch. We collect your optional name, mobile number, contribution, message and consent record to process payments, show the donor book and return funds if needed. Numbers are encrypted. Organizers see masked numbers by default; a reveal is recorded. Anonymous names never appear in the donor book or exports. We use only essential session cookies, local fonts and no advertising trackers. Transaction details are retained for 24 months after a pot closes and settles, then personal fields are anonymized. The financial ledger remains for reconciliation. You can ask for access, correction or deletion through the data-request form. Hosting regions and cross-border safeguards must be agreed before live launch. Contact the organizer for pot questions; use a data request for privacy concerns.',
  terms:
    'Draft terms — legal review required before live launch. Chippin is for adults aged 18 and above with their own MoMo accounts. Verify the organizer and purpose before giving. We are a hackathon prototype and do not claim to be a licensed payment provider. Mock payments move no money; sandbox payments use test currency. You choose the amount and accept the displayed fee before submitting. Payment outcomes are confirmed by the provider. An organizer’s payout mode is shown on each pot. Before payout, available funds can be refunded. After payout, the organizer must approve returning funds; Chippin cannot pull money from a wallet or guarantee recovery. Abuse may result in suspension and a pause on payouts. These terms do not remove your rights under Ghanaian law.',
} as const;
export const copy = copyTerms(english);
