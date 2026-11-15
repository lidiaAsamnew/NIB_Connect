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

export default function OperatorEscrowPage() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    operationsService.getEscrowSummary()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Escrow summary could not be loaded.");
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

  return (
    <section className="ops-page">
      <header className="ops-page-heading">
        <div>
          <p className="eyebrow">Read-only financial monitoring</p>
          <h1>Escrow status</h1>
          <p className="ops-subtitle">View committed, cleared, pending, and cancelled values. This page cannot change financial records.</p>
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
      {isLoading && !summary ? (
        <p className="ops-state" role="status">Loading escrow summary…</p>
      ) : summary && (
        <>
          <div className="ops-metric-grid ops-escrow-metrics">
            <article className="ops-metric-card tone-blue">
              <span>Total escrow committed</span>
              <strong>{formatMoney(summary.totalEscrowCommitted)}</strong>
            </article>
            <article className="ops-metric-card tone-green">
              <span>Total escrow cleared</span>
              <strong>{formatMoney(summary.totalEscrowCleared)}</strong>
            </article>
            <article className="ops-metric-card tone-amber">
              <span>Pending handshake</span>
              <strong>{formatMoney(summary.totalPendingHandshake)}</strong>
            </article>
            <article className="ops-metric-card tone-red">
              <span>Cancelled orders</span>
              <strong>{formatMoney(summary.totalCancelled)}</strong>
            </article>
          </div>
          <section className="ops-panel">
            <header className="ops-panel-heading">
              <div>
                <p className="eyebrow">Escrow ledger visibility</p>
                <h2>Recent transactions</h2>
              </div>
              <span className="ops-panel-caption">{summary.recentTransactions.length} latest records</span>
            </header>
            <div className="ops-table-wrap">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Order</th>
                    <th scope="col">Direction</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.createdAt)}</td>
                      <td className="ops-id-cell">{transaction.orderId}</td>
                      <td>{transaction.direction}</td>
                      <td>{formatMoney(transaction.amount)}</td>
                      <td><span className="ops-badge is-neutral">{transaction.status}</span></td>
                      <td>{transaction.description}</td>
                    </tr>
                  ))}
                  {summary.recentTransactions.length === 0 && (
                    <tr><td className="ops-empty-cell" colSpan="6">No escrow transactions recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
