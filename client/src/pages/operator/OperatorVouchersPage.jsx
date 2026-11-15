import { useEffect, useState } from "react";
import { operationsService } from "../../services/operationsService";

const initialFilters = {
  status: "",
  startupId: "",
  expired: "",
  amountMin: "",
  amountMax: "",
  from: "",
  to: "",
};

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function OperatorVouchersPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    operationsService.listVouchers({ ...appliedFilters, page, limit: 10 })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Voucher records could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appliedFilters, page]);

  function applyFilters(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setIsLoading(true);
    setError("");
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  }

  return (
    <section className="ops-page">
      <header className="ops-page-heading">
        <div>
          <p className="eyebrow">Operational visibility</p>
          <h1>Voucher monitoring</h1>
          <p className="ops-subtitle">Review allocation, expiry, and order commitment without changing voucher records.</p>
        </div>
        <span className="ops-count"><strong>{result.total}</strong> vouchers</span>
      </header>

      <form className="ops-filter-panel ops-filter-grid" onSubmit={applyFilters}>
        <label>
          Status
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active (legacy allocated)</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="COMMITTED_TO_ORDER">Committed to order</option>
            <option value="REDEEMED">Redeemed (legacy settled)</option>
            <option value="REDEEMED_AND_SETTLED">Redeemed and settled</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label>
          Startup ID
          <input value={filters.startupId} onChange={(event) => setFilters({ ...filters, startupId: event.target.value })} />
        </label>
        <label>
          Expiry
          <select value={filters.expired} onChange={(event) => setFilters({ ...filters, expired: event.target.value })}>
            <option value="">Any</option>
            <option value="false">Not expired</option>
            <option value="true">Expired by date</option>
          </select>
        </label>
        <label>
          Minimum amount
          <input type="number" min="0" step="0.01" value={filters.amountMin} onChange={(event) => setFilters({ ...filters, amountMin: event.target.value })} />
        </label>
        <label>
          Maximum amount
          <input type="number" min="0" step="0.01" value={filters.amountMax} onChange={(event) => setFilters({ ...filters, amountMax: event.target.value })} />
        </label>
        <label>
          Allocated from
          <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
        </label>
        <label>
          Allocated to
          <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
        </label>
        <div className="ops-filter-actions">
          <button className="primary-button ops-action" type="submit">Apply filters</button>
          <button className="quiet-button" type="button" onClick={clearFilters}>Clear</button>
        </div>
      </form>

      {error && <p className="ops-error" role="alert">{error}</p>}

      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th scope="col">Voucher</th>
              <th scope="col">Startup</th>
              <th scope="col">Amount</th>
              <th scope="col">Status</th>
              <th scope="col">Allocated</th>
              <th scope="col">Expiry</th>
              <th scope="col">Committed order</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="ops-empty-cell" colSpan="7">Loading vouchers…</td></tr>
            ) : result.items.length === 0 ? (
              <tr><td className="ops-empty-cell" colSpan="7">No voucher records match these filters.</td></tr>
            ) : result.items.map((voucher) => (
              <tr key={voucher.id}>
                <td className="ops-id-cell">{voucher.id}</td>
                <td>{voucher.startupBusinessName || "—"}</td>
                <td>{formatMoney(voucher.amount)}</td>
                <td><span className="ops-badge is-neutral">{voucher.status.replaceAll("_", " ")}</span></td>
                <td>{formatDate(voucher.createdAt)}</td>
                <td>{formatDate(voucher.expiresAt)}</td>
                <td className="ops-id-cell">{voucher.committedOrderId || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="ops-pagination">
        <span>Page {page} of {Math.max(result.totalPages, 1)}</span>
        <div>
          <button className="quiet-button" type="button" disabled={isLoading || page <= 1} onClick={() => {
            setIsLoading(true);
            setError("");
            setPage((value) => value - 1);
          }}>
            Previous
          </button>
          <button className="quiet-button" type="button" disabled={isLoading || page >= result.totalPages} onClick={() => {
            setIsLoading(true);
            setError("");
            setPage((value) => value + 1);
          }}>
            Next
          </button>
        </div>
      </footer>
    </section>
  );
}
