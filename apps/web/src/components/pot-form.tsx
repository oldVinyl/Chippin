'use client';
import { ui } from '../copy/interface';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from './use-auth';
import { ErrorNote, Loading } from './shell';
import { api, mutation } from '../lib/api';
import { parseMoney } from '@chippin/shared';
import { assets } from '../assets/manifest';
import { terms } from '../copy/terms';
export function PotForm({ initial }: { initial?: any }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cover, setCover] = useState(initial?.cover ?? 5);
  const [mode, setMode] = useState(initial?.payoutMode ?? 'ON_CLOSE');
  if (!ready) return <Loading />;
  if (!user)
    return (
      <section className="page narrow">
        <h1>{ui.letsMakeSomethingGood}</h1>
        <p>{ui.createAnOrganizerAccountToStartYourPot}</p>
        <Link href="/signup" className="button">
          {ui.createAnAccount}
        </Link>
        <Link href="/login" className="text-link" style={{ marginLeft: 20 }}>
          {ui.signIn}
        </Link>
      </section>
    );
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const dto = {
        name: f.get('name'),
        story: f.get('story'),
        cover,
        targetMinor: f.get('target')
          ? parseMoney(String(f.get('target')))
          : undefined,
        deadlineAt: f.get('deadline')
          ? new Date(String(f.get('deadline'))).toISOString()
          : undefined,
        payoutMode: mode,
        payoutAt: f.get('payoutAt')
          ? new Date(String(f.get('payoutAt'))).toISOString()
          : undefined,
        payoutPhone: f.get('phone'),
        payoutAccountName: f.get('account'),
        showAmountsPublicly: f.get('amounts') === 'on',
        allowAnonymous: f.get('anonymous') === 'on',
        minContributionMinor: parseMoney(String(f.get('minimum'))),
        thankYouMessage: f.get('thanks'),
      };
      const pot = await api(
        initial ? `/dashboard/pots/${initial.id}` : '/dashboard/pots',
        mutation(user!.csrf, dto, initial ? 'PUT' : 'POST'),
      );
      router.push(`/dashboard/${pot.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page narrow">
      <Link className="back" href="/dashboard">
        {ui.backToMy}
        {terms.potsLower}
      </Link>
      <div className="page-heading">
        <p className="eyebrow">{ui.yourPeopleYourPurpose}</p>
        <h1>{initial ? ui.makeItYours : `Start a ${terms.potLower}.`}</h1>
        <p>{ui.tellYourPeopleWhatYoureBringingTogether}</p>
      </div>
      {!user.phoneVerified && (
        <ErrorNote message="Verify your phone in the dashboard before creating a pot." />
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">
            {ui.giveYour}
            {terms.potLower}
            {ui.aName}
          </label>
          <input
            id="name"
            name="name"
            defaultValue={initial?.name}
            minLength={3}
            maxLength={100}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="story">{ui.theStoryBehindIt}</label>
          <textarea
            id="story"
            name="story"
            defaultValue={initial?.story}
            minLength={10}
            maxLength={5000}
            required
          />
        </div>
        <label>{ui.chooseACover}</label>
        <div className="cover-picker">
          {assets.covers.map((src, i) => (
            <button
              type="button"
              key={src}
              aria-label={`Cover ${i + 1}`}
              aria-pressed={cover === i + 1}
              className={cover === i + 1 ? 'selected' : ''}
              onClick={() => setCover(i + 1)}
            >
              <Image src={src} alt="" fill sizes="140px" />
            </button>
          ))}
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="target">{ui.targetOptional}</label>
            <input
              id="target"
              name="target"
              inputMode="decimal"
              defaultValue={
                initial?.targetMinor ? String(initial.targetMinor / 100) : ''
              }
            />
          </div>
          <div className="field">
            <label htmlFor="deadline">{ui.deadlineOptional}</label>
            <input id="deadline" name="deadline" type="datetime-local" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="mode">{ui.whenShouldFundsGoOut}</label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="ON_CLOSE">{ui.whenICloseThePot}</option>
            <option value="SCHEDULED">{ui.atASetTime}</option>
            {user.verified === 'VERIFIED' && (
              <option value="INSTANT">{ui.asContributionsArrive}</option>
            )}
          </select>
          <small>{ui.instantPayoutsAreAvailableToVerifiedOrganizers}</small>
        </div>
        {mode === 'SCHEDULED' && (
          <div className="field">
            <label htmlFor="payoutAt">{ui.payoutTime}</label>
            <input
              name="payoutAt"
              id="payoutAt"
              type="datetime-local"
              required
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="phone">{ui.payoutMomoNumber}</label>
          <input
            name="phone"
            id="phone"
            type="tel"
            autoComplete="tel"
            required
          />
          <small>
            {initial?.payoutLocked
              ? ui.lockedAfterTheFirstSuccessfulContributionEnterThe
              : ui.thisNumberLocksAfterTheFirstSuccessfulContribution}
          </small>
        </div>
        <div className="field">
          <label htmlFor="account">{ui.payoutAccountHoldersName}</label>
          <input
            name="account"
            id="account"
            defaultValue={initial?.payoutAccountName ?? user.name}
            required
          />
        </div>
        <label className="check">
          <input
            type="checkbox"
            name="amounts"
            defaultChecked={initial?.showAmountsPublicly ?? true}
          />
          <span>{ui.showContributionAmountsInThePublicDonorBook}</span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            name="anonymous"
            defaultChecked={initial?.allowAnonymous ?? true}
          />
          <span>{ui.letPeopleGiveAnonymously}</span>
        </label>
        <div className="field">
          <label htmlFor="minimum">{ui.minimumContribution}</label>
          <input
            name="minimum"
            id="minimum"
            inputMode="decimal"
            defaultValue={
              initial?.minContributionMinor
                ? String(initial.minContributionMinor / 100)
                : '1'
            }
            required
          />
        </div>
        <div className="field">
          <label htmlFor="thanks">{ui.yourThankyouMessage}</label>
          <textarea
            name="thanks"
            id="thanks"
            defaultValue={
              initial?.thankYouMessage ??
              'Thank you for showing up for us. Every contribution matters.'
            }
            maxLength={500}
          />
        </div>
        <ErrorNote message={error} />
        <button
          className="button form-full"
          disabled={busy || !user.phoneVerified}
        >
          {busy
            ? ui.gettingItReady
            : initial
              ? ui.saveChanges
              : `Create my ${terms.potLower}`}
        </button>
      </form>
    </section>
  );
}
