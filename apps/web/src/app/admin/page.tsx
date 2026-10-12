'use client';
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
        <h1>Admin access required.</h1>
        <Link className="button" href="/login">
          Sign in
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
          <p className="eyebrow">LOOKING AFTER THE WHOLE VILLAGE</p>
          <h1>Admin console</h1>
        </div>
        <button
          className="button"
          onClick={() => void action('/admin/reconcile')}
        >
          Run reconciliation
        </button>
      </div>
      <ErrorNote message={error} />
      {notice && <p role="status">{notice}</p>}
      {!data ? (
        <Loading />
      ) : (
        <>
          <h3>Organizer verification</h3>
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
                    Verify
                  </button>
                  <button
                    className="button secondary"
                    onClick={() =>
                      void action(`/admin/organizers/${u.id}/verify`, {
                        status: 'SUSPENDED',
                      })
                    }
                  >
                    Suspend
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>All caught up.</p>
          )}
          <h3>Reported pots</h3>
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
                  Pause this pot
                </button>
              </div>
            ))
          ) : (
            <p>No reports waiting.</p>
          )}
          <h3>Payouts needing attention</h3>
          {data.failedPayouts.length ? (
            data.failedPayouts.map((p: any) => (
              <p key={p.id}>
                {p.providerReference} · {p.status} · {p.lastError}
                {p.status==='FAILED'&&<button className="button secondary" onClick={()=>{if(confirm('Retry this provider-confirmed failed payout?'))void action(`/admin/transfers/payout/${p.id}/retry`);}}>Retry payout</button>}
              </p>
            ))
          ) : (
            <p>No delayed payouts.</p>
          )}
          <h3>Unrecovered refunds</h3>
          <h3>Refund transfers needing attention</h3>
          {data.failedRefunds?.length?data.failedRefunds.map((r:any)=><div className="admin-row" key={r.id}><span>{r.providerReference} · {r.status} · {r.lastError}</span>{r.status==='FAILED'&&<button className="button secondary" onClick={()=>{if(confirm('Retry this provider-confirmed failed refund?'))void action(`/admin/transfers/refund/${r.id}/retry`);}}>Retry refund</button>}</div>):<p>No delayed refund transfers.</p>}
          {data.unrecovered.length ? (
            data.unrecovered.map((p: any) => (
              <p key={p.id}>
                <Link href={`/p/${p.code}`}>{p.name}</Link> · Awaiting organizer
                approval
              </p>
            ))
          ) : (
            <p>No recovery cases waiting.</p>
          )}
          <h3>Data requests</h3>
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
                  Review request
                </button>
              </div>
            ))
          ) : (
            <p>No requests waiting.</p>
          )}
          {selected && (
            <section className="surface">
              <h3>Review {selected.kind.toLowerCase()} request</h3>
              <p>{selected.email}</p>
              <p>{selected.details}</p>
              <p className="helper">
                Verify the person using an existing trusted contact channel. A
                matching phone number alone is not proof of identity.
              </p>
              <label className="check">
                <input
                  type="checkbox"
                  checked={identityVerified}
                  onChange={(e) => setIdentityVerified(e.target.checked)}
                />
                <span>
                  I verified the requester’s identity outside this form.
                </span>
              </label>
              {selected.kind === 'CORRECTION' && (
                <div className="field">
                  <label htmlFor="corrected-name">Correct display name</label>
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
                  ? 'Prepare access file'
                  : 'Fulfill request'}
              </button>
            </section>
          )}
          <h3>Reconciliation log</h3>
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
