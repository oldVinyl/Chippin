'use client';
import { ui } from '../../copy/interface';
import { useState } from 'react';
import { api } from '../../lib/api';
import { ErrorNote } from '../../components/shell';
export default function DataRequest() {
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    try {
      const result = await api('/data-requests', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify(Object.fromEntries(f)),
      });
      setReference(result.reference);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page narrow">
      <div className="page-heading">
        <p className="eyebrow">{ui.yourDataYourSay}</p>
        <h1>{ui.letsLookAfterYourInformation}</h1>
        <p>{ui.askForAccessCorrectionOrDeletionWeVerify}</p>
      </div>
      {reference ? (
        <div className="surface" role="status">
          <h3>{ui.yourRequestIsWithUs}</h3>
          <p>
            {ui.keepThisReference}
            {reference}
          </p>
          <p>{ui.wellContactYouByEmailToVerifyYour}</p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">{ui.emailWeCanReachYouAt}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="phone">{ui.momoNumberUsedToContribute}</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="kind">{ui.whatWouldYouLike}</label>
            <select id="kind" name="kind">
              <option value="ACCESS">{ui.aCopyOfMyInformation}</option>
              <option value="CORRECTION">{ui.correctMyInformation}</option>
              <option value="DELETION">{ui.deletePersonalDetails}</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="details">{ui.tellUsWhatYouNeed}</label>
            <textarea
              id="details"
              name="details"
              minLength={10}
              maxLength={500}
              required
            />
          </div>
          <p className="helper">{ui.pleaseDontIncludeAPinPasswordOrId}</p>
          <ErrorNote message={error} />
          <button className="button" disabled={busy}>
            {busy ? ui.sending : ui.sendMyRequest}
          </button>
        </form>
      )}
    </section>
  );
}
