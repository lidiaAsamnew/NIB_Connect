import { useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import OperatorLayout from "./layouts/OperatorLayout";
import AuditLogsPage from "./pages/operator/AuditLogsPage";
import OperatorDashboardPage from "./pages/operator/OperatorDashboardPage";
import OperatorEscrowPage from "./pages/operator/OperatorEscrowPage";
import OperatorOrdersPage from "./pages/operator/OperatorOrdersPage";
import OperatorSuppliersPage from "./pages/operator/OperatorSuppliersPage";
import OperatorVouchersPage from "./pages/operator/OperatorVouchersPage";
import OperatorSecurityEventsPage from "./pages/operator/OperatorSecurityEventsPage";
import OperatorUsersPage from "./pages/operator/OperatorUsersPage";
import OperatorNotificationsPage from "./pages/operator/OperatorNotificationsPage";

function LoginPage() {
  const { login, user, isLoading, error } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  if (user) return <Navigate to="/me" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    try {
      await login({ identifier, password });
      navigate(location.state?.from?.pathname || "/me", { replace: true });
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || "Unable to sign in. Please try again.");
    }
  }

  return (
    <main className="page-shell">
      <section className="welcome-panel" aria-label="About NIB-Connect">
        <div className="welcome-header">
          <div className="brand-lockup">
            <span className="brand-mark">N</span>
            <span>NIB <strong>CONNECT</strong></span>
          </div>
          <span className="platform-label">B2B SUPPLY CHAIN PLATFORM</span>
        </div>
        <div className="welcome-copy">
          <p className="eyebrow">A connected ecosystem</p>
          <h1>From local business<br />to lasting impact.</h1>
          <p className="welcome-description">
            A closed-loop supply chain experience connecting women-owned businesses, verified suppliers, and NIB operations.
          </p>
          <div className="ecosystem-label">
            <span className="ecosystem-icon" aria-hidden="true">↻</span>
            <span><strong>Closed-loop ecosystem</strong><small>One platform. Connected roles.</small></span>
          </div>
          <div className="role-flow" aria-label="Platform roles">
            <div className="role-step">
              <span className="step-number">01</span>
              <strong>Women-owned<br />businesses</strong>
              <small>Beneficiaries</small>
            </div>
            <span className="flow-arrow" aria-hidden="true">→</span>
            <div className="role-step">
              <span className="step-number">02</span>
              <strong>Verified<br />suppliers</strong>
              <small>Tier-1 partners</small>
            </div>
            <span className="flow-arrow" aria-hidden="true">→</span>
            <div className="role-step">
              <span className="step-number">03</span>
              <strong>NIB<br />operations</strong>
              <small>System control</small>
            </div>
            <span className="flow-arrow" aria-hidden="true">→</span>
            <div className="role-step">
              <span className="step-number">04</span>
              <strong>EU<br />oversight</strong>
              <small>Read-only view</small>
            </div>
          </div>
          <p className="flow-caption">Built around transparency, accountability, and trusted collaboration.</p>
        </div>
        <div className="welcome-footer">
          <span className="status-dot" />
          Authentication and role-based access
        </div>
      </section>

      <section className="form-panel">
        <div className="login-card">
          <div className="mobile-brand brand-lockup">
            <span className="brand-mark">N</span>
            <span>NIB <strong>CONNECT</strong></span>
          </div>
          <p className="eyebrow">Secure supply chain platform</p>
          <h2>Sign in to your account</h2>
          <p className="form-intro">Enter your details to continue to your workspace.</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="identifier">Email or phone number</label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="name@example.com"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
            <div className="password-label">
              <label htmlFor="password">Password</label>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
              {!isLoading && <span aria-hidden="true">→</span>}
            </button>
          </form>
          {(formError || error) && (
            <p className="error-message" role="alert">
              {formError || "Session could not be restored. Please sign in again."}
            </p>
          )}
          <p className="security-note"><span aria-hidden="true">◆</span> Your connection is protected</p>
        </div>
        <footer className="page-footer">© 2026 NIB-Connect <span>•</span> Building trusted connections</footer>
      </section>
    </main>
  );
}

function ProfilePage() {
  const { user, logout } = useAuth();
  return (
    <main className="profile-shell">
      <header className="profile-header">
        <div className="brand-lockup">
          <span className="brand-mark">N</span>
          <span>NIB <strong>CONNECT</strong></span>
        </div>
        <button className="quiet-button" onClick={logout}>Sign out</button>
      </header>
      <section className="profile-card">
        <div className="avatar">{user.fullName?.charAt(0)?.toUpperCase() || "U"}</div>
        <p className="eyebrow">Your account</p>
        <h1>Welcome, {user.fullName}</h1>
        <p className="form-intro">You’re signed in to NIB-Connect.</p>
        <dl className="profile-details">
          <div><dt>Email</dt><dd>{user.email}</dd></div>
          <div><dt>Phone</dt><dd>{user.phoneNumber}</dd></div>
          <div><dt>Account role</dt><dd><span className="role-badge">{user.role?.replaceAll("_", " ")}</span></dd></div>
        </dl>
        {user.role === "NIB_SYSTEM_OPERATOR" && (
          <Link className="profile-link" to="/operator">
            Open operations dashboard <span aria-hidden="true">→</span>
          </Link>
        )}
      </section>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/me" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route
        path="/operator"
        element={
          <ProtectedRoute allowedRoles={["NIB_SYSTEM_OPERATOR"]}>
            <OperatorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/operator/dashboard" replace />} />
        <Route path="dashboard" element={<OperatorDashboardPage />} />
        <Route path="users" element={<OperatorUsersPage />} />
        <Route path="suppliers" element={<OperatorSuppliersPage />} />
        <Route path="vouchers" element={<OperatorVouchersPage />} />
        <Route path="orders" element={<OperatorOrdersPage />} />
        <Route path="escrow" element={<OperatorEscrowPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="security-events" element={<OperatorSecurityEventsPage />} />
        <Route path="notifications" element={<OperatorNotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/me" replace />} />
    </Routes>
  );
}

export default App;
