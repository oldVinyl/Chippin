'use client';
import { ui } from '../copy/interface';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { api } from '../lib/api';
import { ErrorNote } from './shell';
export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await api(`/auth/${signup ? 'signup' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          ...(signup
            ? {
                name: form.get('name'),
                phone: form.get('phone'),
                terms: form.get('terms') === 'on',
              }
            : {}),
        }),
      });
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page narrow">
      <div className="page-heading">
        <p className="eyebrow">{ui.yourPeopleYourPurpose}</p>
        <h1>{signup ? ui.aGoodThingStartsWithYou : ui.goodToHaveYouBack}</h1>
        <p>
          {signup
            ? ui.createAnOrganizerAccountYourFriendsWontNeed
            : ui.signInToLookAfterYourPots}
        </p>
      </div>
      <form onSubmit={submit}>
        {signup && (
          <>
            <div className="field">
              <label htmlFor="name">{ui.yourFullName}</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                minLength={2}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">{ui.yourMobileNumber}</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
              />
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="email">{ui.emailAddress}</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">{ui.password}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={signup ? 'new-password' : 'current-password'}
            minLength={10}
            required
          />
          <small>{ui.atLeast10Characters}</small>
        </div>
        {signup && (
          <label className="check">
            <input name="terms" type="checkbox" required />
            <span>
              {ui.iAm18OrOlderAndAcceptThe}
              <Link href="/terms">{ui.terms2}</Link> {ui.and2}
              <Link href="/privacy">{ui.privacyPolicy2}</Link>.
            </span>
          </label>
        )}
        <ErrorNote message={error} />
        <button className="button form-full" disabled={busy}>
          {busy ? ui.justAMoment : signup ? ui.createMyAccount : ui.signIn2}
          <ArrowRight size={21} />
        </button>
      </form>
      <p style={{ marginTop: 25 }}>
        {signup ? ui.alreadyHaveAnAccount : ui.newHere}{' '}
        <Link className="text-link" href={signup ? '/login' : '/signup'}>
          {signup ? ui.signIn2 : ui.createAnAccount2}
        </Link>
      </p>
    </section>
  );
}
