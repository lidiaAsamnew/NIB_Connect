import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auditService } from "../../services/auditService";

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const { logout } = useAuth();
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    auditService.list({ page, limit: PAGE_SIZE })
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
  }, [page, refreshKey]);

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

  return (
    <main className="profile-shell">
      <header className="profile-header">
        <div className="brand-lockup">
          <span className="brand-mark">N</span>
          <span>NIB <strong>CONNECT</strong></span>
        </div>
        <button className="quiet-button" onClick={logout}>Sign out</button>
      </header>
      <section className="profile-card audit-card">
        <Link className="profile-link" to="/operator">← Operator workspace</Link>
        <p className="eyebrow">Operations &amp; security</p>
        <h1>Audit history</h1>
        <p className="form-intro">Read-only record of tracked platform actions.</p>

        <div className="audit-controls">
          <button
            className="quiet-button"
            onClick={refresh}
            disabled={isLoading}
          >
            Refresh
          </button>
          <span>{total} record{total === 1 ? "" : "s"}</span>
        </div>

        {error && <p className="error-message" role="alert">{error}</p>}
        {isLoading ? (
          <p role="status">Loading audit history...</p>
        ) : (
          <div className="audit-table-wrap">
            <table className="audit-table">
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
                    <td>{item.actorId || "System"}</td>
                    <td>{item.entityType}{item.entityId ? `: ${item.entityId}` : ""}</td>
                    <td>{item.metadata ? JSON.stringify(item.metadata) : "—"}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan="5">No audit records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="audit-controls audit-pagination">
          <button
            className="quiet-button"
            onClick={() => changePage(Math.max(1, page - 1))}
            disabled={isLoading || page <= 1}
          >
            Previous
          </button>
          <span>Page {page} of {pageCount}</span>
          <button
            className="quiet-button"
            onClick={() => changePage(Math.min(pageCount, page + 1))}
            disabled={isLoading || page >= pageCount}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}
