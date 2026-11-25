import { useEffect, useState } from "react";
import { securityEventService } from "../../services/securityEventService";

const PAGE_SIZE = 20;
const INITIAL_FILTERS = {
  eventType: "",
  userId: "",
  orderId: "",
  ipAddress: "",
  from: "",
  to: "",
};

function SecurityEventDetails({ event, onClose }) {
  return (
    <div
      className="ops-modal-backdrop"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) onClose();
      }}
    >
      <section
        className="ops-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="security-event-title"
      >
        <div className="ops-modal-heading">
          <div>
            <p className="eyebrow">Security event details</p>
            <h2 id="security-event-title">{event.eventType}</h2>
          </div>
          <button className="quiet-button" type="button" onClick={onClose}>Close</button>
        </div>
        <dl className="ops-detail-grid">
          <div><dt>Time</dt><dd>{new Date(event.createdAt).toLocaleString()}</dd></div>
          <div><dt>User</dt><dd>{event.user?.fullName || event.userId || "Unknown"}</dd></div>
          <div><dt>User email</dt><dd>{event.user?.email || "—"}</dd></div>
          <div><dt>Order</dt><dd>{event.orderId || "—"}</dd></div>
          <div><dt>IP address</dt><dd>{event.ipAddress || "—"}</dd></div>
        </dl>
        <h3 className="ops-modal-section-title">Message</h3>
        <p className="ops-subtitle">{event.message}</p>
        <h3 className="ops-modal-section-title">Safe metadata</h3>
        <pre className="ops-security-metadata">
          {event.metadata ? JSON.stringify(event.metadata, null, 2) : "No additional metadata."}
        </pre>
      </section>
    </div>
  );
}

export default function OperatorSecurityEventsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    securityEventService.list({ ...appliedFilters, page, limit: PAGE_SIZE })
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(
          requestError.response?.data?.message ||
          "Security events could not be loaded. Please try again.",
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
    setFilters(INITIAL_FILTERS);
    setPage(1);
    setAppliedFilters(INITIAL_FILTERS);
  }

  function changePage(nextPage) {
    setIsLoading(true);
    setError("");
    setPage(nextPage);
  }

  return (
    <section className="ops-page">
      <div className="ops-page-heading">
        <div>
          <p className="eyebrow">Operations &amp; security</p>
          <h1>Security events</h1>
          <p className="ops-subtitle">Review suspicious activity and authentication events. Sensitive metadata is redacted.</p>
        </div>
        <div className="ops-count"><strong>{total}</strong> event{total === 1 ? "" : "s"}</div>
      </div>

      <form className="ops-filter-panel ops-filter-grid" onSubmit={applyFilters}>
        <label>
          Event type
          <input
            value={filters.eventType}
            onChange={(event) => setFilters({ ...filters, eventType: event.target.value })}
            maxLength={64}
            placeholder="e.g. OTP_BRUTE_FORCE_SUSPECTED"
          />
        </label>
        <label>
          User ID
          <input
            value={filters.userId}
            onChange={(event) => setFilters({ ...filters, userId: event.target.value })}
            placeholder="User UUID"
          />
        </label>
        <label>
          Order ID
          <input
            value={filters.orderId}
            onChange={(event) => setFilters({ ...filters, orderId: event.target.value })}
            placeholder="Order UUID"
          />
        </label>
        <label>
          IP address
          <input
            value={filters.ipAddress}
            onChange={(event) => setFilters({ ...filters, ipAddress: event.target.value })}
            maxLength={45}
            placeholder="Exact IP address"
          />
        </label>
        <label>
          From
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters({ ...filters, from: event.target.value })}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters({ ...filters, to: event.target.value })}
          />
        </label>
        <div className="ops-filter-actions">
          <button className="primary-button ops-action" type="submit" disabled={isLoading}>Apply filters</button>
          <button className="quiet-button" type="button" onClick={clearFilters} disabled={isLoading}>Clear</button>
          <button
            className="quiet-button"
            type="button"
            onClick={() => {
              setIsLoading(true);
              setError("");
              setRefreshKey((current) => current + 1);
            }}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </form>

      {error && <p className="ops-error" role="alert">{error}</p>}

      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Event</th>
              <th scope="col">User</th>
              <th scope="col">Order / IP</th>
              <th scope="col">Message</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="ops-empty-cell" colSpan="6">Loading security events...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="ops-empty-cell" colSpan="6">No security events match these filters.</td></tr>
            ) : items.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td><span className="ops-badge is-warning">{item.eventType}</span></td>
                <td>
                  <span className="ops-table-primary">{item.user?.fullName || "Unknown user"}</span>
                  <span className="ops-table-secondary">{item.user?.email || item.userId || "—"}</span>
                </td>
                <td>
                  <span className="ops-table-primary">{item.orderId || "—"}</span>
                  <span className="ops-table-secondary">{item.ipAddress || "—"}</span>
                </td>
                <td>{item.message}</td>
                <td>
                  <button className="ops-text-button" type="button" onClick={() => setSelectedEvent(item)}>
                    View details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ops-pagination">
        <span>{total} event{total === 1 ? "" : "s"} found</span>
        <div>
          <button
            className="quiet-button"
            type="button"
            onClick={() => changePage(Math.max(1, page - 1))}
            disabled={isLoading || page <= 1}
          >
            Previous
          </button>
          <span>Page {page} of {pageCount}</span>
          <button
            className="quiet-button"
            type="button"
            onClick={() => changePage(Math.min(pageCount, page + 1))}
            disabled={isLoading || page >= pageCount}
          >
            Next
          </button>
        </div>
      </div>

      {selectedEvent && (
        <SecurityEventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </section>
  );
}
