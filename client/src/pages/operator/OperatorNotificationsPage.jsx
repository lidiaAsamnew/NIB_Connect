import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  announceNotificationsUpdated,
  notificationService,
} from "../../services/notificationService";

const PAGE_SIZE = 20;
const INITIAL_FILTERS = { type: "", unreadOnly: "" };

export default function OperatorNotificationsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState({ items: [], total: 0, unreadCount: 0 });
  const [pendingId, setPendingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    notificationService.list({
      ...appliedFilters,
      page,
      limit: PAGE_SIZE,
    })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Notifications could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appliedFilters, page, refreshKey]);

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

  async function markAsRead(id) {
    setPendingId(id);
    setError("");
    try {
      await notificationService.markRead(id);
      announceNotificationsUpdated();
      setIsLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Notification could not be updated.");
    } finally {
      setPendingId("");
    }
  }

  async function markAllAsRead() {
    setPendingId("all");
    setError("");
    try {
      await notificationService.markAllRead();
      announceNotificationsUpdated();
      setIsLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Notifications could not be updated.");
    } finally {
      setPendingId("");
    }
  }

  const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <section className="ops-page">
      <header className="ops-page-heading">
        <div>
          <p className="eyebrow">Operator administration</p>
          <h1>Notification center</h1>
          <p className="ops-subtitle">Review operational alerts and mark them as read.</p>
        </div>
        <div className="ops-count"><strong>{result.unreadCount}</strong> unread</div>
      </header>

      <form className="ops-filter-panel ops-filter-grid" onSubmit={applyFilters}>
        <label>
          Notification type
          <input
            value={filters.type}
            onChange={(event) => setFilters({ ...filters, type: event.target.value })}
            maxLength={64}
            placeholder="Filter by type"
          />
        </label>
        <label>
          Read status
          <select value={filters.unreadOnly} onChange={(event) => setFilters({ ...filters, unreadOnly: event.target.value })}>
            <option value="">All notifications</option>
            <option value="true">Unread only</option>
          </select>
        </label>
        <div className="ops-filter-actions">
          <button className="primary-button ops-action" type="submit" disabled={isLoading}>Apply filters</button>
          <button className="quiet-button" type="button" onClick={clearFilters} disabled={isLoading}>Clear</button>
          <button
            className="quiet-button"
            type="button"
            onClick={markAllAsRead}
            disabled={isLoading || pendingId !== "" || result.unreadCount === 0}
          >
            {pendingId === "all" ? "Saving..." : "Mark all as read"}
          </button>
        </div>
      </form>

      {error && <p className="ops-error" role="alert">{error}</p>}

      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Type</th>
              <th scope="col">Notification</th>
              <th scope="col">Status</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="ops-empty-cell" colSpan="5">Loading notifications...</td></tr>
            ) : result.items.length === 0 ? (
              <tr><td className="ops-empty-cell" colSpan="5">No notifications match these filters.</td></tr>
            ) : result.items.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td><span className="ops-badge is-neutral">{item.type.replaceAll("_", " ")}</span></td>
                <td>
                  <span className="ops-table-primary">{item.title}</span>
                  <span className="ops-table-secondary">{item.message}</span>
                </td>
                <td><span className={`ops-badge ${item.isRead ? "is-neutral" : "is-warning"}`}>{item.isRead ? "Read" : "Unread"}</span></td>
                <td>
                  <div className="ops-row-actions">
                    {item.link?.startsWith("/operator/") && <Link className="ops-text-button" to={item.link}>Open</Link>}
                    {!item.isRead && (
                      <button
                        className="ops-text-button"
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        disabled={pendingId !== ""}
                      >
                        {pendingId === item.id ? "Saving..." : "Mark read"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="ops-pagination">
        <span>{result.total} notifications</span>
        <div>
          <button className="quiet-button" type="button" disabled={isLoading || page <= 1} onClick={() => {
            setIsLoading(true);
            setPage((value) => value - 1);
          }}>
            Previous
          </button>
          <span>Page {page} of {pageCount}</span>
          <button className="quiet-button" type="button" disabled={isLoading || page >= pageCount} onClick={() => {
            setIsLoading(true);
            setPage((value) => value + 1);
          }}>
            Next
          </button>
        </div>
      </footer>
    </section>
  );
}
