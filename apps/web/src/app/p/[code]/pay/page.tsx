'use client';
import { use, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, LockKey } from '@phosphor-icons/react';
import { formatMoney, parseMoney, networkFor } from '@chippin/shared';
import { useLive } from '../../../../components/use-live';
import { Loading, ErrorNote } from '../../../../components/shell';
import { api, Pot } from '../../../../lib/api';
import { terms, modeCopy } from '../../../../copy/terms';
import { copy } from '../../../../copy/en';
export default function Pay({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data: pot, error } = useLive<Pot>(`/pots/${code}`);
  const router = useRouter();
  const [amount, setAmount] = useState('50');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [scenario, setScenario] = useState('success');
  const [duplicate, setDuplicate] = useState(false);
  const [needsDuplicate, setNeedsDuplicate] = useState(false);
  const key = useRef('');
  if (!pot)
    return error ? (
      <section className="page narrow">
        <ErrorNote message={error} />
      </section>
    ) : (
      <Loading />
    );
  let minor = 0;
  try {
    minor = parseMoney(amount);
  } catch {}
  let network = '';
  try {
    if (phone) network = networkFor(phone);
  } catch {}
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFailure('');
    try {
      const amountMinor = parseMoney(amount);
      networkFor(phone);
      if (amountMinor < pot!.minContributionMinor)
        throw new Error(
          `Please give at least ${formatMoney(pot!.minContributionMinor, pot!.currency)}.`,
        );
      if (!consent)
        throw new Error('Please accept the privacy policy and terms.');
      setBusy(true);
      key.current ||= crypto.randomUUID();
      const c = await api(`/pots/${code}/contributions`, {
        method: 'POST',
        headers: { 'Idempotency-Key': key.current },
        body: JSON.stringify({
          amountMinor,
          phone,
          displayName: name || undefined,
          message: message || undefined,
          isAnonymous: anonymous,
          consent,
          scenario,
          confirmDuplicate: duplicate,
        }),
      });
      router.push(`/p/${code}/pay/${c.id}`);
    } catch (e) {
      const text = (e as Error).message;
      setFailure(text);
      if (text.includes('similar contribution')) {
        setNeedsDuplicate(true);
        key.current = '';
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page narrow">
      <Link className="back" href={`/p/${code}`}>
        <ArrowLeft />
        Back to the {terms.potLower}
      </Link>
      <div className="page-heading">
        <p className="eyebrow">A LITTLE KINDNESS, RIGHT HERE</p>
        <h1>
          {terms.chipIn} for
          <br />
          {pot.name}
        </h1>
        <p>Your contribution joins {pot.count} others. Every bit counts.</p>
      </div>
      {pot.demo && <span className="tag">DEMO · NO MONEY MOVES</span>}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="amount">
            How much would you like to give? ({pot.currency})
          </label>
          <div className="quick-amounts">
            {[20, 50, 100, 200].map((a) => (
              <button
                key={a}
                className={amount === String(a) ? 'active' : ''}
                type="button"
                onClick={() => {
                  setAmount(String(a));
                  key.current = '';
                }}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              key.current = '';
            }}
            required
          />
          <small>
            Minimum {formatMoney(pot.minContributionMinor, pot.currency)}. Fee:{' '}
            {formatMoney(0, pot.currency)}.
          </small>
        </div>
        <div className="field">
          <label htmlFor="phone">Your MoMo number</label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="024 123 4567"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              key.current = '';
            }}
            required
          />
          <small>
            {network
              ? `Network: ${network}. Number portability may affect this estimate.`
              : 'Use the number on your own MoMo account.'}
          </small>
        </div>
        <div className="field">
          <label htmlFor="name">Your name (optional)</label>
          <input
            id="name"
            autoComplete="name"
            maxLength={80}
            disabled={anonymous}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              key.current = '';
            }}
          />
        </div>
        {pot.allowAnonymous && (
          <label className="check">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => {
                setAnonymous(e.target.checked);
                key.current = '';
              }}
            />
            <span>Give anonymously. Keep my name out of the donor book.</span>
          </label>
        )}
        <div className="field">
          <label htmlFor="message">A little message (optional)</label>
          <textarea
            id="message"
            value={message}
            maxLength={240}
            onChange={(e) => {
              setMessage(e.target.value);
              key.current = '';
            }}
          />
        </div>
        {pot.demo && (
          <div className="field">
            <label htmlFor="scenario">Demo payment outcome</label>
            <select
              id="scenario"
              value={scenario}
              onChange={(e) => {
                setScenario(e.target.value);
                key.current = '';
              }}
            >
              <option value="success">Successful contribution</option>
              <option value="declined">Declined</option>
              <option value="timeout">Still checking (timeout)</option>
              <option value="delayed">Delayed success (45 seconds)</option>
              <option value="missing-callback">Callback never arrives</option>
              <option value="duplicate">Duplicate callback</option>
            </select>
          </div>
        )}
        <div className="summary">
          <dl>
            <div>
              <dt>Your contribution</dt>
              <dd>{formatMoney(minor, pot.currency)}</dd>
            </div>
            <div>
              <dt>Chippin fee</dt>
              <dd>{formatMoney(0, pot.currency)}</dd>
            </div>
            <div>
              <dt>Total to approve</dt>
              <dd>{formatMoney(minor, pot.currency)}</dd>
            </div>
            <div>
              <dt>Paid to</dt>
              <dd>{pot.payoutAccountName}</dd>
            </div>
          </dl>
          <p>{modeCopy[pot.payoutMode]}</p>
        </div>
        <label className="check">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              key.current = '';
            }}
          />
          <span>
            I’m 18 or older and agree to the{' '}
            <Link href="/privacy" target="_blank">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms" target="_blank">
              Terms
            </Link>
            . My number is kept privately for this payment and any refund.
          </span>
        </label>
        <ErrorNote message={failure} />
        {needsDuplicate && (
          <label className="check">
            <input
              type="checkbox"
              checked={duplicate}
              onChange={(e) => setDuplicate(e.target.checked)}
            />
            <span>
              I checked my receipt and want to make another contribution.
            </span>
          </label>
        )}
        <button
          className="button form-full"
          disabled={busy || pot.status !== 'OPEN' || pot.suspended}
          type="submit"
        >
          {busy
            ? 'Getting your payment ready…'
            : `${terms.chipIn} ${formatMoney(minor, pot.currency)}`}
          <ArrowRight size={22} />
        </button>
        <p className="helper" style={{ marginTop: 20 }}>
          <LockKey size={18} style={{ display: 'inline' }} /> {copy.pin}
        </p>
      </form>
    </section>
  );
}
