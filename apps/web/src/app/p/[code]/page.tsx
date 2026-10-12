'use client';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  UsersThree,
  Flag,
} from '@phosphor-icons/react';
import { formatMoney } from '@chippin/shared';
import { useLive } from '../../../components/use-live';
import { SharePanel } from '../../../components/share-panel';
import { Loading, ErrorNote } from '../../../components/shell';
import { api, Pot } from '../../../lib/api';
import { assets } from '../../../assets/manifest';
import { copy } from '../../../copy/en';
import { modeCopy, terms } from '../../../copy/terms';
export default function PotPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { data: pot, error } = useLive<Pot>(`/pots/${code}`);
  if (!pot)
    return error ? (
      <section className="page narrow">
        <h1>We couldn’t find that {terms.potLower}.</h1>
        <ErrorNote message={error} />
        <Link className="button" href="/">
          Try another code
        </Link>
      </section>
    ) : (
      <Loading />
    );
  const progress = pot.targetMinor
    ? Math.min(100, (pot.totalMinor / pot.targetMinor) * 100)
    : 0;
  async function report() {
    const reason = prompt(
      'What should we look into? Please avoid sharing personal information.',
    );
    if (reason && reason.length >= 10) {
      try {
        await api(`/pots/${code}/report`, {
          method: 'POST',
          headers: { 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({ reason }),
        });
        alert('Thank you. An admin will review this pot.');
      } catch (e) {
        alert((e as Error).message);
      }
    }
  }
  return (
    <section className="page">
      <Link className="back" href="/">
        <ArrowLeft />
        All together, with Chippin
      </Link>
      <div className="pot-layout">
        <div className="pot-info">
          <div className="pot-cover">
            <Image
              src={assets.covers[pot.cover - 1]}
              alt=""
              fill
              priority
              sizes="(max-width:700px) 100vw, 600px"
            />
          </div>
          <p className="eyebrow">A LITTLE FROM ALL OF US</p>
          <h1>{pot.name}</h1>
          <p className="verified">
            By {pot.organizer.name}
            {pot.organizer.verified && (
              <>
                <ShieldCheck size={20} weight="fill" />
                Verified organizer
              </>
            )}
          </p>
          <h3>The story behind this {terms.potLower}.</h3>
          <p className="story">{pot.story}</p>
          <section className="donors">
            <h3>
              {terms.donorBook}
              <span className="tag" style={{ marginLeft: 12 }}>
                <UsersThree size={17} />
                {pot.count} friends
              </span>
            </h3>
            {pot.donors.length ? (
              pot.donors.map((d) => (
                <article className="donor-row" key={d.id}>
                  <span className="donor-initial">{d.name[0]}</span>
                  <div>
                    <strong>{d.name}</strong>
                    {d.message && <p>{d.message}</p>}
                    <time dateTime={d.at}>
                      {new Date(d.at).toLocaleDateString('en-GH', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {d.status === 'REFUNDED' ? ' · Refunded' : ''}
                    </time>
                  </div>
                  {d.amountMinor !== null && (
                    <strong>{formatMoney(d.amountMinor, pot.currency)}</strong>
                  )}
                </article>
              ))
            ) : (
              <div className="surface">
                <Image src={assets.empty} width={120} height={110} alt="" />
                <p>
                  Be the first to put a little kindness in this {terms.potLower}
                  .
                </p>
              </div>
            )}
          </section>
        </div>
        <aside className="pot-summary">
          <span className="tag">
            {pot.demo ? 'DEMO · NO MONEY MOVES' : 'MTN SANDBOX · TEST CURRENCY'}
          </span>
          <p className="helper">Together, you’ve raised</p>
          <div className="big-total" aria-live="polite">
            {formatMoney(pot.totalMinor, pot.currency)}
          </div>
          {pot.targetMinor && (
            <>
              <p className="helper">
                of {formatMoney(pot.targetMinor, pot.currency)} ·{' '}
                {Math.round(progress)}% of the way
              </p>
              <div
                className="progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label="Contribution target"
              >
                <span style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
          <p className="helper">
            {pot.count} contributions ·{' '}
            {pot.deadlineAt
              ? `Closes ${new Date(pot.deadlineAt).toLocaleDateString('en-GH')}`
              : 'Every little bit helps'}
          </p>
          {pot.status === 'OPEN' && !pot.suspended ? (
            <Link className="button" href={`/p/${code}/pay`}>
              {terms.chipIn}
              <ArrowRight size={22} />
            </Link>
          ) : (
            <p className="surface">
              {pot.suspended
                ? 'This pot is under review. Payments are paused.'
                : pot.status === 'REFUNDING'
                  ? 'Refunds are being processed.'
                  : 'This pot is closed.'}
            </p>
          )}
          <p className="helper">
            {modeCopy[pot.payoutMode]}{' '}
            {pot.payoutAt && new Date(pot.payoutAt).toLocaleString('en-GH')}
          </p>
          <p className="helper">
            Paid to: <strong>{pot.payoutAccountName}</strong>
          </p>
          {pot.unrecovered && (
            <ErrorNote message="The organizer has not returned the paid-out funds. Chippin cannot pull money from their wallet. Refunds are waiting for recovery." />
          )}
          <SharePanel name={pot.name} code={code} />
          <p className="helper">{copy.scam}</p>
          <button className="text-link" onClick={report}>
            <Flag size={18} />
            Report this {terms.potLower}
          </button>
        </aside>
      </div>
    </section>
  );
}
