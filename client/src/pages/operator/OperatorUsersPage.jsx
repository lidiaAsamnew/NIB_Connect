import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { userManagementService } from "../../services/userManagementService";

const PAGE_SIZE = 20;
const INITIAL_FILTERS = { search: "", role: "", status: "" };
const USER_ROLES = [
  "NIB_SYSTEM_OPERATOR",
  "EU_COMPLIANCE_OFFICER",
  "WOMEN_STARTUP_OWNER",
  "TIER1_SUPPLIER",
];

function UserDetails({ user, onClose }) {
  return (
    <div
      className="ops-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="ops-modal" role="dialog" aria-modal="true" aria-labelledby="user-detail-title">
        <div className="ops-modal-heading">
          <div>
            <p className="eyebrow">Account details</p>
            <h2 id="user-detail-title">{user.fullName}</h2>
          </div>
          <button className="quiet-button" type="button" onClick={onClose}>Close</button>
        </div>
        <dl className="ops-detail-grid">
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Phone</dt><dd>{user.phoneNumber}</dd></div>
          <div><dt>Role</dt><dd>{user.role.replaceAll("_", " ")}</dd></div>
          <div><dt>Status</dt><dd>{user.isActive ? "Active" : "Deactivated"}</dd></div>
          {user.startupProfile && (
            <div><dt>Startup</dt><dd>{user.startupProfile.businessName}</dd></div>
          )}
          {user.supplierProfile && (
            <div>
              <dt>Supplier</dt>
              <dd>{user.supplierProfile.companyName} ({user.supplierProfile.isVerified ? "verified" : "unverified"})</dd>
            </div>
          )}
          <div><dt>Created</dt><dd>{new Date(user.createdAt).toLocaleString()}</dd></div>
        </dl>
        <p className="ops-id-cell">{user.id}</p>
      </section>
    </div>
  );
}

export default function OperatorUsersPage() {
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingUserId, setPendingUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    userManagementService.list({ ...appliedFilters, page, limit: PAGE_SIZE })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || "Users could not be loaded.");
        }
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

  async function viewDetails(id) {
    setIsLoadingDetail(true);
    setError("");
    try {
      setSelectedUser(await userManagementService.get(id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "User details could not be loaded.");
    } finally {
      setIsLoadingDetail(false);
    }
  }

  async function changeStatus(target, isActive) {
    const verb = isActive ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${verb} ${target.fullName}?`)) return;

    setPendingUserId(target.id);
    setError("");
    try {
      await (isActive
        ? userManagementService.activate(target.id)
        : userManagementService.deactivate(target.id));
      setIsLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || `User could not be ${isActive ? "activated" : "deactivated"}.`);
    } finally {
      setPendingUserId("");
    }
  }

  const pageCount = Math.max(1, result.totalPages);

  return (
    <section className="ops-page">
      <header className="ops-page-heading">
        <div>
          <p className="eyebrow">Operator administration</p>
          <h1>User management</h1>
          <p className="ops-subtitle">Review accounts and control access. Deactivation is audit logged and takes effect immediately.</p>
        </div>
        <div className="ops-count"><strong>{result.total}</strong> users</div>
      </header>

      <form className="ops-filter-panel ops-filter-grid" onSubmit={applyFilters}>
        <label>
          Search
          <input
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            maxLength={254}
            placeholder="Name, email, or phone"
          />
        </label>
        <label>
          Role
          <select value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
            <option value="">All roles</option>
            {USER_ROLES.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}
          </select>
        </label>
        <label>
          Account status
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </label>
        <div className="ops-filter-actions">
          <button className="primary-button ops-action" type="submit" disabled={isLoading}>Apply filters</button>
          <button className="quiet-button" type="button" onClick={clearFilters} disabled={isLoading}>Clear</button>
        </div>
      </form>

      {error && <p className="ops-error" role="alert">{error}</p>}

      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Phone</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="ops-empty-cell" colSpan="6">Loading users...</td></tr>
            ) : result.items.length === 0 ? (
              <tr><td className="ops-empty-cell" colSpan="6">No users match these filters.</td></tr>
            ) : result.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="ops-table-primary">{item.fullName}</span>
                  <span className="ops-table-secondary">{item.email}</span>
                </td>
                <td>{item.phoneNumber}</td>
                <td>{item.role.replaceAll("_", " ")}</td>
                <td><span className={`ops-badge ${item.isActive ? "" : "is-warning"}`}>{item.isActive ? "Active" : "Deactivated"}</span></td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="ops-row-actions">
                    <button className="ops-text-button" type="button" onClick={() => viewDetails(item.id)} disabled={isLoadingDetail}>
                      View
                    </button>
                    <button
                      className="ops-text-button"
                      type="button"
                      onClick={() => changeStatus(item, !item.isActive)}
                      disabled={pendingUserId === item.id || (item.isActive && item.id === currentUser?.id)}
                      title={item.isActive && item.id === currentUser?.id ? "Your operator account cannot be deactivated here." : undefined}
                    >
                      {pendingUserId === item.id ? "Saving..." : item.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="ops-pagination">
        <span>{result.total} users</span>
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

      {isLoadingDetail && <p className="ops-state" role="status">Loading account details...</p>}
      {selectedUser && <UserDetails user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </section>
  );
}
