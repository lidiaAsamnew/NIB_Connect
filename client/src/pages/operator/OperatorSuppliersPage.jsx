import { useEffect, useState } from "react";
import { operationsService } from "../../services/operationsService";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function SupplierDetails({ supplier, onClose }) {
  return (
    <div className="ops-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="ops-modal" role="dialog" aria-modal="true" aria-labelledby="supplier-detail-title">
        <header className="ops-modal-heading">
          <div>
            <p className="eyebrow">Supplier profile</p>
            <h2 id="supplier-detail-title">{supplier.companyName}</h2>
          </div>
          <button className="ops-close" type="button" onClick={onClose} aria-label="Close supplier details">×</button>
        </header>
        <dl className="ops-detail-grid">
          <div><dt>TIN</dt><dd>{supplier.tinNumber}</dd></div>
          <div><dt>Discount rate</dt><dd>{Number(supplier.discountRate).toFixed(2)}%</dd></div>
          <div><dt>Contact</dt><dd>{supplier.user?.fullName || supplier.contactPerson || "—"}</dd></div>
          <div><dt>Email</dt><dd>{supplier.user?.email || "—"}</dd></div>
          <div><dt>Address</dt><dd>{supplier.address || "—"}</dd></div>
          <div><dt>Created</dt><dd>{formatDate(supplier.createdAt)}</dd></div>
          <div><dt>Status</dt><dd>{supplier.isVerified ? "Verified" : "Unverified"}</dd></div>
          <div><dt>Verification remarks</dt><dd>{supplier.verificationRemarks || "—"}</dd></div>
        </dl>
      </section>
    </div>
  );
}

export default function OperatorSuppliersPage() {
  const [filters, setFilters] = useState({ status: "unverified", search: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 0 });
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    operationsService.listSuppliers({ ...appliedFilters, page, limit: 10 })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Supplier profiles could not be loaded.");
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
    const cleared = { status: "", search: "" };
    setFilters(cleared);
    setAppliedFilters(cleared);
    setPage(1);
  }

  function beginAction(supplier, action) {
    setPendingAction({ supplier, action });
    setRemarks("");
  }

  async function submitAction(event) {
    event.preventDefault();
    if (!pendingAction) return;
    setIsSaving(true);
    setError("");
    try {
      if (pendingAction.action === "verify") {
        await operationsService.verifySupplier(pendingAction.supplier.id, remarks.trim());
      } else {
        await operationsService.unverifySupplier(pendingAction.supplier.id, remarks.trim() || undefined);
      }
      setPendingAction(null);
      setIsLoading(true);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Supplier verification could not be updated.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="ops-page">
      <header className="ops-page-heading">
        <div>
          <p className="eyebrow">Operations control</p>
          <h1>Supplier verification</h1>
          <p className="ops-subtitle">Review supplier profiles and record verification decisions.</p>
        </div>
        <span className="ops-count"><strong>{result.total}</strong> matching suppliers</span>
      </header>

      <form className="ops-filter-panel" onSubmit={applyFilters}>
        <label>
          Verification status
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All suppliers</option>
            <option value="unverified">Unverified</option>
            <option value="verified">Verified</option>
          </select>
        </label>
        <label className="ops-search-field">
          Company name or TIN
          <input
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Search supplier profiles"
          />
        </label>
        <div className="ops-filter-actions">
          <button className="primary-button ops-action" type="submit">Apply filters</button>
          <button
            className="quiet-button"
            type="button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </form>

      {error && <p className="ops-error" role="alert">{error}</p>}

      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col">TIN</th>
              <th scope="col">Discount</th>
              <th scope="col">Verification</th>
              <th scope="col">Created</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="ops-empty-cell" colSpan="6">Loading suppliers…</td></tr>
            ) : result.items.length === 0 ? (
              <tr><td className="ops-empty-cell" colSpan="6">No supplier profiles match these filters.</td></tr>
            ) : result.items.map((supplier) => (
              <tr key={supplier.id}>
                <td>
                  <strong className="ops-table-primary">{supplier.companyName}</strong>
                  <span className="ops-table-secondary">{supplier.user?.fullName || supplier.contactPerson || "Contact not provided"}</span>
                </td>
                <td>{supplier.tinNumber}</td>
                <td>{Number(supplier.discountRate).toFixed(2)}%</td>
                <td>
                  <span className={`ops-badge ${supplier.isVerified ? "is-success" : "is-warning"}`}>
                    {supplier.isVerified ? "Verified" : "Unverified"}
                  </span>
                </td>
                <td>{formatDate(supplier.createdAt)}</td>
                <td>
                  <div className="ops-row-actions">
                    <button className="ops-text-button" type="button" onClick={() => setSelectedSupplier(supplier)}>
                      Details
                    </button>
                    <button
                      className="ops-text-button"
                      type="button"
                      onClick={() => beginAction(supplier, supplier.isVerified ? "unverify" : "verify")}
                    >
                      {supplier.isVerified ? "Unverify" : "Verify"}
                    </button>
                  </div>
                </td>
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
          <button
            className="quiet-button"
            type="button"
            disabled={isLoading || page >= result.totalPages}
            onClick={() => {
              setIsLoading(true);
              setError("");
              setPage((value) => value + 1);
            }}
          >
            Next
          </button>
        </div>
      </footer>

      {selectedSupplier && <SupplierDetails supplier={selectedSupplier} onClose={() => setSelectedSupplier(null)} />}

      {pendingAction && (
        <div className="ops-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) setPendingAction(null);
        }}>
          <form className="ops-modal" onSubmit={submitAction}>
            <header className="ops-modal-heading">
              <div>
                <p className="eyebrow">Verification decision</p>
                <h2>{pendingAction.action === "verify" ? "Verify supplier" : "Unverify supplier"}</h2>
              </div>
              <button
                className="ops-close"
                type="button"
                aria-label="Close verification form"
                disabled={isSaving}
                onClick={() => setPendingAction(null)}
              >
                ×
              </button>
            </header>
            <p className="ops-subtitle">{pendingAction.supplier.companyName}</p>
            <label className="ops-textarea-label" htmlFor="verification-remarks">
              Remarks {pendingAction.action === "verify" ? "(required)" : "(optional)"}
            </label>
            <textarea
              id="verification-remarks"
              maxLength={500}
              minLength={pendingAction.action === "verify" ? 3 : undefined}
              required={pendingAction.action === "verify"}
              rows={4}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Record the reason for this decision"
            />
            <div className="ops-filter-actions">
              <button className="primary-button ops-action" type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Confirm"}
              </button>
              <button className="quiet-button" type="button" disabled={isSaving} onClick={() => setPendingAction(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
