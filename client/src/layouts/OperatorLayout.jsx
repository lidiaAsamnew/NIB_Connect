import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { notificationService } from "../services/notificationService";

const navigation = [
  { to: "/operator/dashboard", label: "Dashboard" },
  { to: "/operator/users", label: "Users" },
  { to: "/operator/suppliers", label: "Suppliers" },
  { to: "/operator/vouchers", label: "Vouchers" },
  { to: "/operator/orders", label: "Orders" },
  { to: "/operator/escrow", label: "Escrow" },
  { to: "/operator/security-events", label: "Security events" },
  { to: "/operator/notifications", label: "Notifications", showUnreadCount: true },
  { to: "/operator/audit-logs", label: "Audit logs" },
];

export default function OperatorLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    let active = true;
    async function refreshUnreadCount() {
      try {
        const result = await notificationService.list({ page: 1, limit: 1 });
        if (!active) return;
        setUnreadCount(result.unreadCount);
        setNotificationError("");
      } catch (error) {
        if (!active) return;
        setNotificationError(
          error.response?.data?.message || "Notification count could not be loaded.",
        );
      }
    }

    refreshUnreadCount();
    window.addEventListener("nib-notifications-updated", refreshUnreadCount);
    return () => {
      active = false;
      window.removeEventListener("nib-notifications-updated", refreshUnreadCount);
    };
  }, [location.pathname]);

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
              title={item.showUnreadCount && notificationError ? notificationError : undefined}
            >
              {item.label}
              {item.showUnreadCount && unreadCount > 0 && (
                <span className="operator-notification-count" aria-label={`${unreadCount} unread`}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              {item.showUnreadCount && notificationError && (
                <span className="operator-notification-error" role="alert" title={notificationError}>!</span>
              )}
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
