import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const EU_COMPLIANCE_ROLE = "EU_COMPLIANCE_OFFICER";

export default function LoginPage() {
  const { login, logout, user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = location.state?.from?.pathname || "/eu/dashboard";

  if (user?.role === EU_COMPLIANCE_ROLE) {
    return <Navigate to={destination} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      const signedInUser = await login({ identifier, password });
      if (signedInUser.role !== EU_COMPLIANCE_ROLE) {
        logout();
        setFormError("This account is not authorized for EU Compliance.");
        return;
      }
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(
        error.response?.data?.message || error.message || "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        display: "grid",
        minHeight: "100vh",
        placeItems: "center",
        padding: 24,
        background: "linear-gradient(135deg, #f3f7f5 0%, #edf3f1 56%, #f7f8f2 100%)",
      }}
    >
      <section
        aria-labelledby="login-heading"
        style={{
          width: "min(100%, 420px)",
          padding: 32,
          background: "#fff",
          border: "1px solid #dfe8e4",
          borderRadius: 8,
          boxShadow: "0 12px 36px rgba(23, 58, 66, 0.08)",
        }}
      >
        <p style={{ margin: "0 0 8px", color: "#16856b", fontSize: 12, fontWeight: 700, letterSpacing: 1.2 }}>
          NIB CONNECT - EU COMPLIANCE
        </p>
        <h1 id="login-heading" style={{ margin: "0 0 8px", color: "#173a42", fontSize: 28 }}>
          Sign in
        </h1>
        <p style={{ margin: "0 0 24px", color: "#647772" }}>
          Use your EU Compliance Officer account to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="identifier" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Email address
          </label>
          <input
            id="identifier"
            autoComplete="username"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            style={{ boxSizing: "border-box", width: "100%", marginBottom: 16, padding: 11 }}
          />
          <label htmlFor="password" style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ boxSizing: "border-box", width: "100%", marginBottom: 20, padding: 11 }}
          />
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            style={{
              width: "100%",
              padding: 12,
              color: "#fff",
              background: "#16856b",
              border: 0,
              borderRadius: 4,
              cursor: isLoading || isSubmitting ? "wait" : "pointer",
              fontWeight: 700,
            }}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {formError && (
          <p role="alert" style={{ margin: "16px 0 0", color: "#a12525" }}>
            {formError}
          </p>
        )}
      </section>
    </main>
  );
}
