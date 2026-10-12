'use client';
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
        <p className="eyebrow">YOUR PEOPLE. YOUR PURPOSE.</p>
        <h1>
          {signup ? 'A good thing starts with you.' : 'Good to have you back.'}
        </h1>
        <p>
          {signup
            ? 'Create an organizer account. Your friends won’t need one to contribute.'
            : 'Sign in to look after your pots.'}
        </p>
      </div>
      <form onSubmit={submit}>
        {signup && (
          <>
            <div className="field">
              <label htmlFor="name">Your full name</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                minLength={2}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Your mobile number</label>
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
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={signup ? 'new-password' : 'current-password'}
            minLength={10}
            required
          />
          <small>At least 10 characters.</small>
        </div>
        {signup && (
          <label className="check">
            <input name="terms" type="checkbox" required />
            <span>
              I am 18 or older and accept the <Link href="/terms">Terms</Link>{' '}
              and <Link href="/privacy">Privacy Policy</Link>.
            </span>
          </label>
        )}
        <ErrorNote message={error} />
        <button className="button form-full" disabled={busy}>
          {busy ? 'Just a moment…' : signup ? 'Create my account' : 'Sign in'}
          <ArrowRight size={21} />
        </button>
      </form>
      <p style={{ marginTop: 25 }}>
        {signup ? 'Already have an account?' : 'New here?'}{' '}
        <Link className="text-link" href={signup ? '/login' : '/signup'}>
          {signup ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </section>
  );
}
