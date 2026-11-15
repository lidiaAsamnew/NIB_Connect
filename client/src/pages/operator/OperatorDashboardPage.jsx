import { useEffect, useState } from "react";
import { operationsService } from "../../services/operationsService";

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

function formatLabel(value) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export default function OperatorDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    operationsService.getDashboard()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "The operations summary could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  function refresh() {
    setIsLoading(true);
    setError("");
    setRefreshKey((key) => key + 1);
  }

  if (isLoading && !summary) {
    return <p className="ops-state" role="status">Loading operations summary…</p>;
  }

  if (error && !summary) {
    return (
      <section className="ops-page">
        <p className="eyebrow">Operations control</p>
        <h1>NIB operations dashboard</h1>
        <p className="ops-error" role="alert">{error}</p>
        <button className="primary-button ops-action" type="button" onClick={refresh}>
          Try again
        </button>
      </section>
    );
  }

  const cards = [
    { label: "Verified suppliers", value: summary.suppliers.verified, tone: "green" },
    { label: "Awaiting verification", value: summary.suppliers.unverified, tone: "amber" },
    { label: "Allocated vouchers", value: formatMoney(summary.vouchers.allocatedValue), tone: "blue" },
    { label: "Committed vouchers", value: formatMoney(summary.vouchers.committedValue), tone: "blue" },
    { label: "Settled vouchers", value: formatMoney(summary.vouchers.settledValue), tone: "green" },
    { label: "Pending handshake orders", value: summary.orders.pendingHandshake, tone: "amber" },
    { label: "Cleared orders", value: summary.orders.cleared, tone: "green" },
    { label: "Security events · 24h", value: summary.security.totalEventsLast24Hours, tone: "red" },
  ];

  return (
    <section className="ops-page">
      <header className="ops-page-heading">
        <div>
          <p className="eyebrow">Operations control</p>
          <h1>NIB operations dashboard</h1>
          <p className="ops-subtitle">A live view of supplier verification, voucher use, orders, escrow, and security.</p>
        </div>
        <button
          className="quiet-button"
          type="button"
          disabled={isLoading}
          onClick={refresh}
        >
          {isLoading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && <p className="ops-error" role="alert">{error}</p>}

      <div className="ops-overview" aria-label="Platform totals">
        <div><span>Total users</span><strong>{summary.users.total}</strong></div>
        <div><span>Startup profiles</span><strong>{summary.startups.total}</strong></div>
        <div><span>Supplier profiles</span><strong>{summary.suppliers.total}</strong></div>
        <div><span>Vouchers</span><strong>{summary.vouchers.total}</strong></div>
        <div><span>Orders</span><strong>{summary.orders.total}</strong></div>
      </div>

      <div className="ops-metric-grid">
        {cards.map((card) => (
          <article className={`ops-metric-card tone-${card.tone}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="ops-dashboard-columns">
        <section className="ops-panel">
          <header className="ops-panel-heading">
            <div>
              <p className="eyebrow">Order monitoring</p>
              <h2>Orders by status</h2>
            </div>
          </header>
          <div className="ops-status-list">
            {Object.entries(summary.orders.byStatus).map(([status, count]) => (
              <div className="ops-status-row" key={status}>
                <span>{formatLabel(status)}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-panel">
          <header className="ops-panel-heading">
            <div>
              <p className="eyebrow">Security monitoring · last 24 hours</p>
              <h2>Recent security events</h2>
            </div>
          </header>
          {summary.security.recentEvents.length === 0 ? (
            <p className="ops-empty">No recent security events.</p>
          ) : (
            <ul className="ops-event-list">
              {summary.security.recentEvents.map((event) => (
                <li key={event.id}>
                  <div>
                    <strong>{formatLabel(event.eventType)}</strong>
                    <p>{event.message}</p>
                  </div>
                  <time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
