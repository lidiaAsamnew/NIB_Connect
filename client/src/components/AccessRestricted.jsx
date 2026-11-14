import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import "../styles/week2.css";

export default function AccessRestricted() {
  const { logout } = useAuth();
  const location = useLocation();
  return (
    <div className="w2-access-page">
      <div className="w2-access-brand"><Logo /></div>
      <section className="w2-panel w2-access-card">
        <span className="w2-lock-art" aria-hidden="true"><Shield /><LockKeyhole /></span>
        <h1>Access Restricted</h1>
        <p>You need to be logged in as a Women Startup Owner to view this page.</p>
        <Link to="/login" replace state={{ from: location }} onClick={logout} className="w2-button"><ArrowLeft aria-hidden="true" /> Go to Login</Link>
      </section>
    </div>
  );
}
