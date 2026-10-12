'use client';
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
        {pot?.demo ? 'DEMO PAYMENT' : 'YOUR CONTRIBUTION'}
      </p>
      <h1 aria-live="polite">
        {receipt.status === 'REFUNDED'
          ? 'Your contribution was returned.'
          : success
            ? 'A little from you. A lot of love.'
            : failed
              ? 'That payment didn’t go through.'
              : remaining
                ? 'Check your phone.'
                : 'We’re checking with MoMo.'}
      </h1>
      <p>
        {success
          ? pot?.thankYouMessage
          : failed
            ? receipt.failureReason ||
              'MoMo confirmed this payment did not complete. You can try again when you’re ready.'
            : remaining
              ? pot?.demo
                ? 'No phone prompt is sent in demo mode. We’re simulating your chosen payment outcome.'
                : 'Open the MoMo prompt on your phone, check the amount and approve there. You never enter your PIN here.'
              : copy.unknown}
      </p>
      {!success && !failed && (
        <p role="status">
          {remaining
            ? `Checking automatically · ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
            : 'Still checking. You can return to this receipt later.'}
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
        <span className="helper">Keep this reference</span>
        <code className="reference">{receipt.reference}</code>
      </div>
      {failed ? (
        <Link className="button" href={`/p/${code}/pay`}>
          Try again
        </Link>
      ) : (
        <Link className="button" href={`/p/${code}`}>
          Back to the pot
        </Link>
      )}
      {!success && !failed && (
        <details>
          <summary>Didn’t get a prompt?</summary>
          <p>
            Check that your phone has a signal, the number is right and your
            MoMo account is active. If money left your wallet, keep this receipt
            and wait for confirmation. Don’t give again yet.
          </p>
        </details>
      )}
      {success && pot && <SharePanel name={pot.name} code={code} />}
    </section>
  );
}
