import { useEffect, useState } from "react";
import { auditService } from "../../services/auditService";

const PAGE_SIZE = 20;
const INITIAL_FILTERS = {
  actor: "",
  action: "",
  entityType: "",
  entityId: "",
  from: "",
  to: "",
};

export default function AuditLogsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    auditService.list({ ...appliedFilters, page, limit: PAGE_SIZE })
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError.response?.data?.message ||
          "Audit history could not be loaded. Please try again.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appliedFilters, page, refreshKey]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const refresh = () => {
    setIsLoading(true);
    setError("");
    setRefreshKey((current) => current + 1);
  };
  const changePage = (nextPage) => {
    setIsLoading(true);
    setError("");
    setPage(nextPage);
  };
  const applyFilters = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setPage(1);
    setAppliedFilters({ ...filters });
  };
  const clearFilters = () => {
    setIsLoading(true);
    setError("");
    setFilters(INITIAL_FILTERS);
    setPage(1);
    setAppliedFilters(INITIAL_FILTERS);
  };

  return (
    <section className="ops-page">
      <header className="ops-page-heading">
        <div>
          <p className="eyebrow">Operations &amp; security</p>
          <h1>Audit history</h1>
          <p className="ops-subtitle">Read-only record of tracked platform actions.</p>
        </div>
        <div className="ops-count"><strong>{total}</strong> records</div>
      </header>

      <form className="audit-filter-grid" onSubmit={applyFilters}>
        <label>
          Actor name or email
          <input
            value={filters.actor}
            onChange={(event) => setFilters({ ...filters, actor: event.target.value })}
            maxLength={254}
            placeholder="Search actor"
          />
        </label>
        <label>
          Action
          <input
            value={filters.action}
            onChange={(event) => setFilters({ ...filters, action: event.target.value })}
            maxLength={64}
            placeholder="e.g. USER_DEACTIVATED"
          />
        </label>
        <label>
          Entity type
          <input
            value={filters.entityType}
            onChange={(event) => setFilters({ ...filters, entityType: event.target.value })}
            maxLength={64}
            placeholder="e.g. USER"
          />
        </label>
        <label>
          Entity ID
          <input
            value={filters.entityId}
            onChange={(event) => setFilters({ ...filters, entityId: event.target.value })}
            maxLength={64}
            placeholder="Entity identifier"
          />
        </label>
        <label>
          From
          <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
        </label>
        <label>
          To
          <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
        </label>
        <div className="audit-filter-actions">
          <button className="primary-button" type="submit" disabled={isLoading}>Apply filters</button>
          <button className="quiet-button" type="button" onClick={clearFilters} disabled={isLoading}>Clear</button>
        </div>
      </form>

      <div className="audit-controls">
        <button className="quiet-button" onClick={refresh} disabled={isLoading}>
          Refresh
        </button>
        <span>{total} record{total === 1 ? "" : "s"}</span>
      </div>

      {error && <p className="ops-error" role="alert">{error}</p>}
      {isLoading ? (
        <p className="ops-state" role="status">Loading audit history...</p>
      ) : (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Action</th>
                <th scope="col">Actor</th>
                <th scope="col">Entity</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td>{item.action}</td>
                  <td>
                    {item.actor?.fullName || item.actor?.email || item.actorId || "System"}
                    {item.actor?.email && item.actor?.fullName && <small className="audit-actor-email">{item.actor.email}</small>}
                  </td>
                  <td>{item.entityType}{item.entityId ? `: ${item.entityId}` : ""}</td>
                  <td>{item.metadata ? JSON.stringify(item.metadata) : "—"}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td className="ops-empty-cell" colSpan="5">No audit records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="ops-pagination audit-pagination">
        <div>
          <button
            className="quiet-button"
            onClick={() => changePage(Math.max(1, page - 1))}
            disabled={isLoading || page <= 1}
          >
            Previous
          </button>
          <button
            className="quiet-button"
            onClick={() => changePage(Math.min(pageCount, page + 1))}
            disabled={isLoading || page >= pageCount}
          >
            Next
          </button>
        </div>
        <span>Page {page} of {pageCount}</span>
      </div>
    </section>
  );
}
