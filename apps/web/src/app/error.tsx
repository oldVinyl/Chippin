'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="page narrow">
      <h1>A little hiccup.</h1>
      <p>
        We couldn’t load this page. If you were paying, keep your receipt
        reference and check the status before trying another payment.
      </p>
      <button className="button" onClick={reset}>
        Try loading again
      </button>
    </section>
  );
}
