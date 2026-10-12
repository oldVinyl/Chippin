import Link from 'next/link';
export default function About() {
  return (
    <article className="page narrow policy">
      <p className="eyebrow">A LITTLE FROM EACH OF US</p>
      <h1>Made for the moments we share.</h1>
      <p>
        A number in a WhatsApp group can bring people together. But it doesn’t
        tell you who has given, how much is there, or where the money goes.
      </p>
      <p>
        Chippin gives that kindness a home. One pot, a visible total and a clear
        record. For a family saying goodbye. A school making room. A friend who
        needs a hand.
      </p>
      <p>
        Built for the MTN MoMo Fintech Lab: Everyday Payments & Financial
        Access. This is a hackathon prototype. Live operation would be in
        partnership with MTN or a licensed payment provider.
      </p>
      <Link className="button" href="/p/AKWAABA">
        See a pot in action
      </Link>
    </article>
  );
}
