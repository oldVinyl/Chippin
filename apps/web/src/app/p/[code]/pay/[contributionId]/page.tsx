'use client';
import { ui } from '../../../../../copy/interface';
import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLive } from '../../../../../components/use-live';
import { Loading, ErrorNote } from '../../../../../components/shell';
import { assets } from '../../../../../assets/manifest';
import { SharePanel } from '../../../../../components/share-panel';
import { copy } from '../../../../../copy/en';
import { Pot } from '../../../../../lib/api';
import { formatMoney } from '@chippin/shared';
type Receipt = {
  id: string;
  status: string;
  amountMinor: number;
  reference: string;
  createdAt: string;
  failureReason: string | null;
};
export default function PaymentStatus({
  params,
}: {
  params: Promise<{ code: string; contributionId: string }>;
}) {
  const { code, contributionId } = use(params);
  const { data: receipt, error } = useLive<Receipt>(
    `/contributions/${contributionId}`,
  );
  const { data: pot } = useLive<Pot>(`/pots/${code}`);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);
  if (!receipt)
    return error ? (
      <section className="page narrow">
        <ErrorNote message={error} />
      </section>
    ) : (
      <Loading />
    );
  const success = ['SUCCESSFUL', 'REFUNDED'].includes(receipt.status);
  const failed = ['FAILED', 'EXPIRED'].includes(receipt.status);
  const remaining = Math.max(
    0,
    120 - Math.floor((now - Date.parse(receipt.createdAt)) / 1000),
  );
  return (
    <section className="page narrow status-page">
      <Image
        src={
          success ? assets.success : failed ? assets.failure : assets.pending
        }
        width={260}
        height={230}
        alt=""
      />
      <p className="eyebrow" style={{ justifyContent: 'center' }}>
        {pot?.demo ? ui.demoPayment : ui.yourContribution2}
      </p>
      <h1 aria-live="polite">
        {receipt.status === 'REFUNDED'
          ? ui.yourContributionWasReturned
          : success
            ? ui.aLittleFromYouALotOfLove
            : failed
              ? ui.thatPaymentDidntGoThrough
              : remaining
                ? ui.checkYourPhone
                : ui.wereCheckingWithMomo}
      </h1>
      <p>
        {success
          ? pot?.thankYouMessage
          : failed
            ? receipt.failureReason ||
              'MoMo confirmed this payment did not complete. You can try again when you’re ready.'
            : remaining
              ? pot?.demo
                ? ui.noPhonePromptIsSentInDemoMode
                : ui.openTheMomoPromptOnYourPhoneCheck
              : copy.unknown}
      </p>
      {!success && !failed && (
        <p role="status">
          {remaining
            ? `Checking automatically · ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
            : ui.stillCheckingYouCanReturnToThisReceipt}
        </p>
      )}
      <div className="receipt">
        <strong>
          {formatMoney(receipt.amountMinor, pot?.currency ?? 'GHS')}
        </strong>
        <p className="helper">
          {receipt.status} ·{' '}
          {new Date(receipt.createdAt).toLocaleString('en-GH')}
        </p>
        <span className="helper">{ui.keepThisReference2}</span>
        <code className="reference">{receipt.reference}</code>
      </div>
      {failed ? (
        <Link className="button" href={`/p/${code}/pay`}>
          {ui.tryAgain}
        </Link>
      ) : (
        <Link className="button" href={`/p/${code}`}>
          {ui.backToThePot}
        </Link>
      )}
      {!success && !failed && (
        <details>
          <summary>{ui.didntGetAPrompt}</summary>
          <p>{ui.checkThatYourPhoneHasASignalThe}</p>
        </details>
      )}
      {success && pot && <SharePanel name={pot.name} code={code} />}
    </section>
  );
}
