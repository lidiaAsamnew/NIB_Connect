import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { to: "/operator/dashboard", label: "Dashboard" },
  { to: "/operator/suppliers", label: "Suppliers" },
  { to: "/operator/vouchers", label: "Vouchers" },
  { to: "/operator/orders", label: "Orders" },
  { to: "/operator/escrow", label: "Escrow" },
  { to: "/operator/security-events", label: "Security events" },
  { to: "/operator/audit-logs", label: "Audit logs" },
];

export default function OperatorLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="operator-shell">
      <header className="operator-header">
        <NavLink className="brand-lockup" to="/operator/dashboard" aria-label="NIB Connect operations home">
          <span className="brand-mark">N</span>
          <span>NIB <strong>CONNECT</strong></span>
        </NavLink>
        <nav className="operator-navigation" aria-label="Operations navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `operator-nav-link${isActive ? " is-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="operator-account">
          <span className="operator-account-name">{user?.fullName || "Operator"}</span>
          <button className="quiet-button" type="button" onClick={logout}>Sign out</button>
        </div>
      </header>
      <main className="operator-content">
        <Outlet />
      </main>
    </div>
  );
}
