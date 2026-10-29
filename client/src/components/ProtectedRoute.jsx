import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <p role="status" className="p-6 text-slate-700">Loading your session…</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-slate-700">You do not have permission to open this page.</p>
      </div>
    );
  }
  return children;
}
