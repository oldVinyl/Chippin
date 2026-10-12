'use client';
import { ui } from '../../../copy/interface';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatMoney } from '@chippin/shared';
import { useAuth } from '../../../components/use-auth';
import { SharePanel } from '../../../components/share-panel';
import { PotForm } from '../../../components/pot-form';
import { Loading, ErrorNote } from '../../../components/shell';
import { api, mutation, Pot } from '../../../lib/api';
import { terms } from '../../../copy/terms';
type Detail = Pot & {
  payoutLocked: boolean;
  contributions: {
    id: string;
    name: string;
    amountMinor: number;
    status: string;
    reference: string;
    phone: string;
    at: string;
  }[];
  payouts: { id: string; status: string; amountMinor: number }[];
  refunds: { id: string; status: string }[];
  activity: { id: string; action: string; at: string }[];
};
export default function PotDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, ready } = useAuth();
  const [pot, setPot] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Overview');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const refresh = () =>
      void api<Detail>(`/dashboard/pots/${id}`)
        .then((p) => {
          if (mounted) setPot(p);
        })
        .catch((e) => {
          if (mounted) setError(e.message);
        });
    refresh();
    const events = new EventSource(`/api/dashboard/pots/${id}/events`);
    events.onmessage = (event) => {
      try {
        const value = JSON.parse(event.data);
        if (mounted && !value.unavailable) setPot(value);
      } catch {}
    };
    const timer = setInterval(refresh, 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
      events.close();
    };
  }, [user, id]);
  if (!ready) return <Loading />;
  if (!user)
    return (
      <section className="page narrow">
        <h1>{ui.pleaseSignIn}</h1>
        <Link className="button" href="/login">
          {ui.signIn}
        </Link>
      </section>
    );
  if (!pot)
    return error ? (
      <section className="page">
        <ErrorNote message={error} />
      </section>
    ) : (
      <Loading />
    );
  if (tab === 'Settings')
    return (
      <>
        <div className="page" style={{ paddingBottom: 0, minHeight: 0 }}>
          <button className="text-link" onClick={() => setTab('Overview')}>
            {ui.backToOverview}
          </button>
        </div>
        <PotForm initial={pot} />
      </>
    );
  async function action(which: 'close' | 'cancel') {
    if (
      !confirm(
        which === 'close'
          ? 'Close this pot and release available funds? Contributions will stop.'
          : 'Stop contributions and request refunds? If money has been paid out, you must approve returning it first.',
      )
    )
      return;
    try {
      await api(`/dashboard/pots/${id}/${which}`, mutation(user!.csrf));
      setPot(await api(`/dashboard/pots/${id}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function reveal(cid: string) {
    try {
      const result = await api(
        `/dashboard/pots/${id}/contributions/${cid}/reveal`,
        mutation(user!.csrf),
      );
      setPot((p) =>
        p
          ? {
              ...p,
              contributions: p.contributions.map((c) =>
                c.id === cid ? { ...c, phone: result.phone } : c,
              ),
            }
          : p,
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const rows = pot.contributions.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'ALL' || c.status === filter),
  );
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 6 + i);
    return {
      label: date.toLocaleDateString('en-GH', { weekday: 'short' }),
      value: pot.contributions
        .filter(
          (c) =>
            ['SUCCESSFUL', 'REFUNDED'].includes(c.status) &&
            c.at.slice(0, 10) === date.toISOString().slice(0, 10),
        )
        .reduce((s, c) => s + c.amountMinor, 0),
    };
  });
  const max = Math.max(1, ...days.map((d) => d.value));
  return (
    <section className="page">
      <Link href="/dashboard" className="back">
        {ui.backToMy}
        {terms.potsLower}
      </Link>
      <div className="dashboard-top">
        <div>
          <span className="tag">{pot.status}</span>
          <h1>{pot.name}</h1>
          <p>
            {pot.code} · {pot.organizer.name}
          </p>
        </div>
        <Link className="button secondary" href={`/p/${pot.code}`}>
          {ui.openPublicPage}
        </Link>
      </div>
      <ErrorNote message={error} />
      <div className="tabs">
        {['Overview', 'Donor book', 'Sharing', 'Settings'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? 'active' : ''}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Sharing' ? (
        <SharePanel name={pot.name} code={pot.code} />
      ) : (
        <>
          <div className="stats">
            <div>
              <span>{ui.totalRaised}</span>
              <strong>{formatMoney(pot.totalMinor, pot.currency)}</strong>
            </div>
            <div>
              <span>{ui.contributions2}</span>
              <strong>{pot.count}</strong>
            </div>
            <div>
              <span>{ui.averageContribution}</span>
              <strong>
                {formatMoney(
                  pot.count ? Math.round(pot.totalMinor / pot.count) : 0,
                  pot.currency,
                )}
              </strong>
            </div>
          </div>
          {tab === 'Overview' && (
            <>
              <h3>{ui.aLittleMoreEachDay}</h3>
              <svg
                className="chart"
                viewBox="0 0 700 160"
                role="img"
                aria-label={ui.successfulContributionsOverTheLastSevenDays}
              >
                {days.map((d, i) => (
                  <g key={d.label}>
                    <rect
                      x={i * 100 + 22}
                      y={125 - (d.value / max) * 90}
                      width={55}
                      height={Math.max(2, (d.value / max) * 90)}
                      rx={8}
                      fill="#743014"
                    />
                    <text
                      x={i * 100 + 48}
                      y={151}
                      textAnchor="middle"
                      fontSize={16}
                      fill="#442d1c"
                    >
                      {d.label}
                    </text>
                  </g>
                ))}
              </svg>
              <h3>{ui.whereTheFundsAre}</h3>
              <p>
                {ui.availableAfterReservations}{' '}
                <strong>
                  {formatMoney(pot.balanceMinor ?? 0, pot.currency)}
                </strong>
              </p>
              {pot.payouts.length ? (
                pot.payouts.map((p) => (
                  <p key={p.id}>
                    {formatMoney(p.amountMinor, pot.currency)} ·{' '}
                    {p.status === 'UNKNOWN'
                      ? ui.checkingWithMomo
                      : p.status === 'FAILED'
                        ? ui.payoutDelayedAdminReviewNeeded
                        : p.status}
                  </p>
                ))
              ) : (
                <p>
                  {ui.noPayoutsYet}{' '}
                  {pot.payoutMode === 'ON_CLOSE'
                    ? ui.fundsAreReleasedWhenYouCloseThePot
                    : ui.payoutsFollowYourChosenSchedule}
                </p>
              )}
              {pot.refunds.length > 0 && (
                <p>
                  {pot.refunds.filter((r) => r.status === 'SUCCESSFUL').length}{' '}
                  {ui.of}
                  {pot.refunds.length}
                  {ui.refunded}
                </p>
              )}
              {pot.unrecovered && (
                <ErrorNote message="Refunds are waiting for returned funds. Approve the MoMo request on your payout phone. Chippin cannot debit your wallet without your approval." />
              )}
              <div className="dashboard-actions">
                {pot.status === 'OPEN' && (
                  <button
                    className="button"
                    onClick={() => void action('close')}
                  >
                    {ui.close}
                    {terms.potLower}
                    {ui.releaseFunds}
                  </button>
                )}
                {!['REFUNDING', 'REFUNDED'].includes(pot.status) && (
                  <button
                    className="button secondary"
                    onClick={() => void action('cancel')}
                  >
                    {ui.cancelRequestRefunds}
                  </button>
                )}
              </div>
            </>
          )}
          <h3>{terms.donorBook}</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="search">{ui.findAContributor}</label>
              <input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="filter">{ui.paymentStatus}</label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {['ALL', 'SUCCESSFUL', 'PENDING', 'FAILED', 'REFUNDED'].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{ui.name}</th>
                  <th>{ui.amount}</th>
                  <th>{ui.status}</th>
                  <th>{ui.refund}</th>
                  <th>{ui.momoNumber}</th>
                  <th>{ui.date}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{formatMoney(c.amountMinor, pot.currency)}</td>
                    <td>{c.status}</td>
                    <td>
                      {c.status === 'SUCCESSFUL' && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                ui.returnThisContributionToItsOriginalMomoNumber,
                              )
                            )
                              void api(
                                `/dashboard/pots/${id}/contributions/${c.id}/refund`,
                                mutation(user.csrf),
                              )
                                .then(() =>
                                  api<Detail>(`/dashboard/pots/${id}`),
                                )
                                .then(setPot)
                                .catch((e) => setError(e.message));
                          }}
                        >
                          {ui.refund2}
                        </button>
                      )}
                    </td>
                    <td>
                      {c.phone}{' '}
                      {c.name !== 'Anonymous friend' &&
                        c.phone.includes('*') && (
                          <button
                            aria-label={`Reveal number for ${c.name}`}
                            onClick={() => void reveal(c.id)}
                          >
                            {ui.reveal}
                          </button>
                        )}
                    </td>
                    <td>{new Date(c.at).toLocaleDateString('en-GH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="helper">
            {ui.phoneNumbersAreMaskedRevealsAreRecordedAnonymous}
          </p>
          <div className="dashboard-actions">
            <a
              className="button secondary"
              href={`/api/dashboard/pots/${id}/export?format=csv`}
            >
              {ui.downloadCsv}
            </a>
            <a
              className="button secondary"
              href={`/api/dashboard/pots/${id}/export?format=pdf`}
            >
              {ui.downloadPdf}
            </a>
            <a
              className="button secondary"
              href={`/api/dashboard/pots/${id}/export?format=card`}
            >
              {ui.familyThankyouCard}
            </a>
          </div>
          {pot.activity.length > 0 && (
            <>
              <h3>{ui.recentActivity}</h3>
              {pot.activity.map((a) => (
                <p className="helper" key={a.id}>
                  {a.action.replaceAll('_', ' ').toLowerCase()} ·{' '}
                  {new Date(a.at).toLocaleString('en-GH')}
                </p>
              ))}
            </>
          )}
        </>
      )}
    </section>
  );
}
