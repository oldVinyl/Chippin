'use client';
import { ui } from '../../copy/interface';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/use-auth';
import { Loading, ErrorNote } from '../../components/shell';
import { api, mutation } from '../../lib/api';
export default function Admin() {
  const { user, ready } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [correctedName, setCorrectedName] = useState('');
  const refresh = () =>
    void api('/admin')
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (user?.isAdmin) refresh();
  }, [user]);
  if (!ready) return <Loading />;
  if (!user?.isAdmin)
    return (
      <section className="page">
        <h1>{ui.adminAccessRequired}</h1>
        <Link className="button" href="/login">
          {ui.signIn}
        </Link>
      </section>
    );
  async function action(path: string, body?: unknown) {
    try {
      await api(path, mutation(user!.csrf, body));
      setNotice('Updated.');
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="page">
      <div className="dashboard-top">
        <div>
          <p className="eyebrow">{ui.lookingAfterTheWholeVillage}</p>
          <h1>{ui.adminConsole}</h1>
        </div>
        <button
          className="button"
          onClick={() => void action('/admin/reconcile')}
        >
          {ui.runReconciliation}
        </button>
      </div>
      <ErrorNote message={error} />
      {notice && <p role="status">{notice}</p>}
      {!data ? (
        <Loading />
      ) : (
        <>
          <h3>{ui.organizerVerification}</h3>
          {data.organizers.length ? (
            data.organizers.map((u: any) => (
              <div key={u.id} className="admin-row">
                <span>
                  {u.name} · {u.verificationStatus}
                </span>
                <div>
                  <button
                    className="button secondary"
                    onClick={() =>
                      void action(`/admin/organizers/${u.id}/verify`, {
                        status: 'VERIFIED',
                      })
                    }
                  >
                    {ui.verify}
                  </button>
                  <button
                    className="button secondary"
                    onClick={() =>
                      void action(`/admin/organizers/${u.id}/verify`, {
                        status: 'SUSPENDED',
                      })
                    }
                  >
                    {ui.suspend}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>{ui.allCaughtUp}</p>
          )}
          <h3>{ui.reportedPots}</h3>
          {data.reports.length ? (
            data.reports.map((r: any) => (
              <div className="admin-row" key={r.id}>
                <span>
                  {r.potCode}: {r.reason}
                </span>
                <button
                  className="button secondary"
                  onClick={() =>
                    void action(`/admin/pots/${r.potCode}/suspend`)
                  }
                >
                  {ui.pauseThisPot}
                </button>
              </div>
            ))
          ) : (
            <p>{ui.noReportsWaiting}</p>
          )}
          <h3>{ui.payoutsNeedingAttention}</h3>
          {data.failedPayouts.length ? (
            data.failedPayouts.map((p: any) => (
              <p key={p.id}>
                {p.providerReference} · {p.status} · {p.lastError}
                {p.status === 'FAILED' && (
                  <button
                    className="button secondary"
                    onClick={() => {
                      if (confirm(ui.retryThisProviderconfirmedFailedPayout))
                        void action(`/admin/transfers/payout/${p.id}/retry`);
                    }}
                  >
                    {ui.retryPayout}
                  </button>
                )}
              </p>
            ))
          ) : (
            <p>{ui.noDelayedPayouts}</p>
          )}
          <h3>{ui.unrecoveredRefunds}</h3>
          <h3>{ui.refundTransfersNeedingAttention}</h3>
          {data.failedRefunds?.length ? (
            data.failedRefunds.map((r: any) => (
              <div className="admin-row" key={r.id}>
                <span>
                  {r.providerReference} · {r.status} · {r.lastError}
                </span>
                {r.status === 'FAILED' && (
                  <button
                    className="button secondary"
                    onClick={() => {
                      if (confirm(ui.retryThisProviderconfirmedFailedRefund))
                        void action(`/admin/transfers/refund/${r.id}/retry`);
                    }}
                  >
                    {ui.retryRefund}
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>{ui.noDelayedRefundTransfers}</p>
          )}
          {data.unrecovered.length ? (
            data.unrecovered.map((p: any) => (
              <p key={p.id}>
                <Link href={`/p/${p.code}`}>{p.name}</Link>
                {ui.awaitingOrganizerApproval}
              </p>
            ))
          ) : (
            <p>{ui.noRecoveryCasesWaiting}</p>
          )}
          <h3>{ui.dataRequests}</h3>
          {data.requests.length ? (
            data.requests.map((r: any) => (
              <div className="admin-row" key={r.id}>
                <span>
                  {r.kind} · {r.status} · {r.id}
                </span>
                <button
                  className="button secondary"
                  onClick={() =>
                    void api(`/admin/data-requests/${r.id}`)
                      .then((d) => {
                        setSelected(d);
                        setIdentityVerified(false);
                        setCorrectedName('');
                      })
                      .catch((e) => setError(e.message))
                  }
                >
                  {ui.reviewRequest}
                </button>
              </div>
            ))
          ) : (
            <p>{ui.noRequestsWaiting}</p>
          )}
          {selected && (
            <section className="surface">
              <h3>
                {ui.review}
                {selected.kind.toLowerCase()}
                {ui.request}
              </h3>
              <p>{selected.email}</p>
              <p>{selected.details}</p>
              <p className="helper">
                {ui.verifyThePersonUsingAnExistingTrustedContact}
              </p>
              <label className="check">
                <input
                  type="checkbox"
                  checked={identityVerified}
                  onChange={(e) => setIdentityVerified(e.target.checked)}
                />
                <span>{ui.iVerifiedTheRequestersIdentityOutsideThisForm}</span>
              </label>
              {selected.kind === 'CORRECTION' && (
                <div className="field">
                  <label htmlFor="corrected-name">
                    {ui.correctDisplayName}
                  </label>
                  <input
                    id="corrected-name"
                    value={correctedName}
                    onChange={(e) => setCorrectedName(e.target.value)}
                  />
                </div>
              )}
              <button
                className="button"
                disabled={!identityVerified || selected.status === 'FULFILLED'}
                onClick={() =>
                  void api(
                    `/admin/data-requests/${selected.id}/fulfill`,
                    mutation(user.csrf, {
                      identityVerified,
                      displayName: correctedName || undefined,
                    }),
                  )
                    .then((result) => {
                      if (result.records) {
                        const url = URL.createObjectURL(
                          new Blob([JSON.stringify(result.records, null, 2)], {
                            type: 'application/json',
                          }),
                        );
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'chippin-data-access.json';
                        a.click();
                        URL.revokeObjectURL(url);
                        setNotice(
                          'Access file prepared. Deliver it securely to the verified requester.',
                        );
                      } else {
                        setNotice(
                          'Request fulfilled. Financial totals are unchanged.',
                        );
                        setSelected(null);
                      }
                      refresh();
                    })
                    .catch((e) => setError(e.message))
                }
              >
                {selected.kind === 'ACCESS'
                  ? ui.prepareAccessFile
                  : ui.fulfillRequest}
              </button>
            </section>
          )}
          <h3>{ui.reconciliationLog}</h3>
          {data.reconciliation.map((r: any) => (
            <p className="helper" key={r.id}>
              {r.action} · {new Date(r.at).toLocaleString('en-GH')}
            </p>
          ))}
        </>
      )}
    </section>
  );
}
