'use client';
import { ui } from '../../../../copy/interface';
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
        {ui.backToThe}
        {terms.potLower}
      </Link>
      <div className="page-heading">
        <p className="eyebrow">{ui.aLittleKindnessRightHere}</p>
        <h1>
          {terms.chipIn}
          {ui.for}
          <br />
          {pot.name}
        </h1>
        <p>
          {ui.yourContributionJoins}
          {pot.count}
          {ui.othersEveryBitCounts}
        </p>
      </div>
      {pot.demo && <span className="tag">{ui.demoNoMoneyMoves}</span>}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="amount">
            {ui.howMuchWouldYouLikeToGive}
            {pot.currency})
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
            {ui.minimum}
            {formatMoney(pot.minContributionMinor, pot.currency)}
            {ui.fee} {formatMoney(0, pot.currency)}.
          </small>
        </div>
        <div className="field">
          <label htmlFor="phone">{ui.yourMomoNumber}</label>
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
              : ui.useTheNumberOnYourOwnMomoAccount}
          </small>
        </div>
        <div className="field">
          <label htmlFor="name">{ui.yourNameOptional}</label>
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
            <span>{ui.giveAnonymouslyKeepMyNameOutOfThe}</span>
          </label>
        )}
        <div className="field">
          <label htmlFor="message">{ui.aLittleMessageOptional}</label>
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
            <label htmlFor="scenario">{ui.demoPaymentOutcome}</label>
            <select
              id="scenario"
              value={scenario}
              onChange={(e) => {
                setScenario(e.target.value);
                key.current = '';
              }}
            >
              <option value="success">{ui.successfulContribution}</option>
              <option value="declined">{ui.declined}</option>
              <option value="timeout">{ui.stillCheckingTimeout}</option>
              <option value="delayed">{ui.delayedSuccess45Seconds}</option>
              <option value="missing-callback">
                {ui.callbackNeverArrives}
              </option>
              <option value="duplicate">{ui.duplicateCallback}</option>
            </select>
          </div>
        )}
        <div className="summary">
          <dl>
            <div>
              <dt>{ui.yourContribution}</dt>
              <dd>{formatMoney(minor, pot.currency)}</dd>
            </div>
            <div>
              <dt>{ui.chippinFee}</dt>
              <dd>{formatMoney(0, pot.currency)}</dd>
            </div>
            <div>
              <dt>{ui.totalToApprove}</dt>
              <dd>{formatMoney(minor, pot.currency)}</dd>
            </div>
            <div>
              <dt>{ui.paidTo2}</dt>
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
            {ui.im18OrOlderAndAgreeToThe}{' '}
            <Link href="/privacy" target="_blank">
              {ui.privacyPolicy}
            </Link>{' '}
            {ui.and}{' '}
            <Link href="/terms" target="_blank">
              {ui.terms}
            </Link>
            {ui.myNumberIsKeptPrivatelyForThisPayment}
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
            <span>{ui.iCheckedMyReceiptAndWantToMake}</span>
          </label>
        )}
        <button
          className="button form-full"
          disabled={busy || pot.status !== 'OPEN' || pot.suspended}
          type="submit"
        >
          {busy
            ? ui.gettingYourPaymentReady
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
