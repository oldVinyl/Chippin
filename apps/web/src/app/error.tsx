'use client';
import { ui } from '../copy/interface';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="page narrow">
      <h1>{ui.aLittleHiccup}</h1>
      <p>{ui.weCouldntLoadThisPageIfYouWere}</p>
      <button className="button" onClick={reset}>
        {ui.tryLoadingAgain}
      </button>
    </section>
  );
}
