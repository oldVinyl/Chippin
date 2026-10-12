'use client';
import { ui } from '../../../copy/interface';
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
        <h1>
          {ui.weCouldntFindThat}
          {terms.potLower}.
        </h1>
        <ErrorNote message={error} />
        <Link className="button" href="/">
          {ui.tryAnotherCode}
        </Link>
      </section>
    ) : (
      <Loading />
    );
  const progress = pot.targetMinor
    ? Math.min(100, (pot.totalMinor / pot.targetMinor) * 100)
    : 0;
  async function report() {
    const reason = prompt(ui.whatShouldWeLookIntoPleaseAvoidSharing);
    if (reason && reason.length >= 10) {
      try {
        await api(`/pots/${code}/report`, {
          method: 'POST',
          headers: { 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({ reason }),
        });
        alert(ui.thankYouAnAdminWillReviewThisPot);
      } catch (e) {
        alert((e as Error).message);
      }
    }
  }
  return (
    <section className="page">
      <Link className="back" href="/">
        <ArrowLeft />
        {ui.allTogetherWithChippin}
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
          <p className="eyebrow">{ui.aLittleFromAllOfUs}</p>
          <h1>{pot.name}</h1>
          <p className="verified">
            {ui.by}
            {pot.organizer.name}
            {pot.organizer.verified && (
              <>
                <ShieldCheck size={20} weight="fill" />
                {ui.verifiedOrganizer}
              </>
            )}
          </p>
          <h3>
            {ui.theStoryBehindThis}
            {terms.potLower}.
          </h3>
          <p className="story">{pot.story}</p>
          <section className="donors">
            <h3>
              {terms.donorBook}
              <span className="tag" style={{ marginLeft: 12 }}>
                <UsersThree size={17} />
                {pot.count}
                {ui.friends}
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
                      {d.status === 'REFUNDED' ? ui.refunded2 : ''}
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
                  {ui.beTheFirstToPutALittleKindness}
                  {terms.potLower}.
                </p>
              </div>
            )}
          </section>
        </div>
        <aside className="pot-summary">
          <span className="tag">
            {pot.demo
              ? ui.demoNoMoneyMoves
              : pot.mode === 'live'
                ? ui.momoPayments
                : ui.mtnSandboxTestCurrency}
          </span>
          <p className="helper">{ui.togetherYouveRaised}</p>
          <div className="big-total" aria-live="polite">
            {formatMoney(pot.totalMinor, pot.currency)}
          </div>
          {pot.targetMinor && (
            <>
              <p className="helper">
                {ui.of}
                {formatMoney(pot.targetMinor, pot.currency)} ·{' '}
                {Math.round(progress)}
                {ui.ofTheWay}
              </p>
              <div
                className="progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label={ui.contributionTarget}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
          <p className="helper">
            {pot.count}
            {ui.contributions3}{' '}
            {pot.deadlineAt
              ? `Closes ${new Date(pot.deadlineAt).toLocaleDateString('en-GH')}`
              : ui.everyLittleBitHelps}
          </p>
          {pot.status === 'OPEN' && !pot.suspended ? (
            <Link className="button" href={`/p/${code}/pay`}>
              {terms.chipIn}
              <ArrowRight size={22} />
            </Link>
          ) : (
            <p className="surface">
              {pot.suspended
                ? ui.thisPotIsUnderReviewPaymentsArePaused
                : pot.status === 'REFUNDING'
                  ? ui.refundsAreBeingProcessed
                  : ui.thisPotIsClosed}
            </p>
          )}
          <p className="helper">
            {modeCopy[pot.payoutMode]}{' '}
            {pot.payoutAt && new Date(pot.payoutAt).toLocaleString('en-GH')}
          </p>
          <p className="helper">
            {ui.paidTo}
            <strong>{pot.payoutAccountName}</strong>
          </p>
          {pot.unrecovered && (
            <ErrorNote message="The organizer has not returned the paid-out funds. Chippin cannot pull money from their wallet. Refunds are waiting for recovery." />
          )}
          <SharePanel name={pot.name} code={code} />
          <p className="helper">{copy.scam}</p>
          <button className="text-link" onClick={report}>
            <Flag size={18} />
            {ui.reportThis}
            {terms.potLower}
          </button>
        </aside>
      </div>
    </section>
  );
}
