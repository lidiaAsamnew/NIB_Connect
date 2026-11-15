import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AccessRestricted from "./AccessRestricted";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isLoading, isAuthenticated, sessionExpired } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <p role="status" className="p-6 text-slate-700">Loading your session…</p>;
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location, expired: sessionExpired }} />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessRestricted />;
  }
  return children;
}
