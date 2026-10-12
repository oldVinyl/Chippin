'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Plus } from '@phosphor-icons/react';
import { formatMoney } from '@chippin/shared';
import { useAuth } from '../../components/use-auth';
import { Loading, ErrorNote } from '../../components/shell';
import { api, mutation, Pot } from '../../lib/api';
import { assets } from '../../assets/manifest';
import { terms } from '../../copy/terms';
export default function Dashboard() {
  const { user, ready, setUser } = useAuth();
  const [pots, setPots] = useState<Pot[]>([]);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (user)
      void api<Pot[]>('/dashboard/pots')
        .then(setPots)
        .catch((e) => setError(e.message));
  }, [user]);
  if (!ready) return <Loading />;
  if (!user)
    return (
      <section className="page narrow">
        <h1>A little good starts here.</h1>
        <p>Sign in to create and look after your pots.</p>
        <div className="hero-actions">
          <Link href="/login" className="button">
            Sign in
          </Link>
          <Link href="/signup" className="text-link">
            Create an account
            <ArrowUpRight />
          </Link>
        </div>
      </section>
    );
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/auth/otp/verify', mutation(user!.csrf, { code: otp }));
      setUser({ ...user!, phoneVerified: true });
      setNotice('Your phone is verified.');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="page">
      <div className="dashboard-top">
        <div>
          <p className="eyebrow">A LITTLE FROM YOUR PEOPLE</p>
          <h1>Hello, {user.name.split(' ')[0]}.</h1>
          <p>Good things you’re bringing together.</p>
        </div>
        <Link className="button" href="/dashboard/new">
          <Plus size={22} />
          Start a {terms.potLower}
        </Link>
      </div>
      <ErrorNote message={error} />
      {notice && <p role="status">{notice}</p>}
      {!user.phoneVerified && (
        <section className="surface">
          <h3>First, verify your phone.</h3>
          <p>
            A code was sent when you signed up. In local development, it appears
            in the API terminal.
          </p>
          <form onSubmit={verify}>
            <div className="field">
              <label htmlFor="otp">Six-digit code</label>
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                pattern="[0-9]{6}"
                required
              />
            </div>
            <button className="button">Verify phone</button>
            <button
              type="button"
              className="text-link"
              style={{ marginLeft: 20 }}
              onClick={() =>
                void api('/auth/otp', mutation(user.csrf))
                  .then(() => setNotice('A fresh code is on its way.'))
                  .catch((e) => setError(e.message))
              }
            >
              Send a new code
            </button>
          </form>
        </section>
      )}
      <div className="stats">
        <div>
          <span>Raised together</span>
          <strong>
            {formatMoney(
              pots.reduce((s, p) => s + p.totalMinor, 0),
              pots[0]?.currency,
            )}
          </strong>
        </div>
        <div>
          <span>Kind contributions</span>
          <strong>{pots.reduce((s, p) => s + p.count, 0)}</strong>
        </div>
        <div>
          <span>Your {terms.potsLower}</span>
          <strong>{pots.length}</strong>
        </div>
      </div>
      {pots.length ? (
        <div className="pot-list">
          {pots.map((p) => (
            <Link key={p.id} href={`/dashboard/${p.id}`}>
              <div className="list-cover">
                <Image
                  src={assets.covers[p.cover - 1]}
                  alt=""
                  fill
                  sizes="(max-width:700px) 100vw, 500px"
                />
              </div>
              <div className="list-body">
                <span className="tag">{p.status.replaceAll('_', ' ')}</span>
                <h3>{p.name}</h3>
                <div className="amount-line">
                  <strong>{formatMoney(p.totalMinor, p.currency)}</strong>
                  <span>{p.count} contributions</span>
                </div>
                {p.targetMinor && (
                  <div className="progress">
                    <span
                      style={{
                        width: `${Math.min(100, (p.totalMinor / p.targetMinor) * 100)}%`,
                      }}
                    />
                  </div>
                )}
                <span className="text-link">
                  Look after this {terms.potLower}
                  <ArrowUpRight size={20} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="surface">
          <Image src={assets.empty} width={150} height={130} alt="" />
          <h3>Your first {terms.potLower} is waiting.</h3>
          <p>
            A name, a story and a reason to come together. That’s all it takes.
          </p>
        </div>
      )}
      <div className="dashboard-actions">
        {user.verified !== 'VERIFIED' && (
          <button
            className="button secondary"
            onClick={() =>
              void api('/dashboard/verification', mutation(user.csrf))
                .then(() =>
                  setNotice(
                    'Verification submitted. An admin will review your organizer details.',
                  ),
                )
                .catch((e) => setError(e.message))
            }
          >
            Request organizer verification
          </button>
        )}
        {user.isAdmin && (
          <Link href="/admin" className="button secondary">
            Admin console
          </Link>
        )}
        <button
          className="text-link"
          onClick={() =>
            void api('/auth/logout', mutation(user.csrf))
              .then(() => setUser(null))
              .catch((e) => setError(e.message))
          }
        >
          Sign out
        </button>
      </div>
    </section>
  );
}
