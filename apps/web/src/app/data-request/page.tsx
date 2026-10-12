'use client';
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
        <p className="eyebrow">YOUR DATA. YOUR SAY.</p>
        <h1>Let’s look after your information.</h1>
        <p>
          Ask for access, correction or deletion. We verify your identity before
          making changes. Deletion removes personal details; the financial
          ledger totals stay intact.
        </p>
      </div>
      {reference ? (
        <div className="surface" role="status">
          <h3>Your request is with us.</h3>
          <p>Keep this reference: {reference}</p>
          <p>We’ll contact you by email to verify your identity.</p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email we can reach you at</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="phone">MoMo number used to contribute</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="kind">What would you like?</label>
            <select id="kind" name="kind">
              <option value="ACCESS">A copy of my information</option>
              <option value="CORRECTION">Correct my information</option>
              <option value="DELETION">Delete personal details</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="details">Tell us what you need</label>
            <textarea
              id="details"
              name="details"
              minLength={10}
              maxLength={500}
              required
            />
          </div>
          <p className="helper">
            Please don’t include a PIN, password or ID document.
          </p>
          <ErrorNote message={error} />
          <button className="button" disabled={busy}>
            {busy ? 'Sending…' : 'Send my request'}
          </button>
        </form>
      )}
    </section>
  );
}
