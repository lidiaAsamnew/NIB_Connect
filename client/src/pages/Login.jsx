import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";
import { googleIcon, loginWoman } from "../assets";
import AuthShell from "../components/AuthShell";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/authService";
import { toE164IfPhone, validateLogin } from "../utils/validators";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const destination = location.state?.from?.pathname || "/dashboard";
  const notice = location.state?.registered
    ? "Account created. Please log in."
    : location.state?.expired
      ? "Your session expired. Please login again."
      : "";

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validateLogin(values);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      await login(toE164IfPhone(values.identifier), values.password);
      navigate(destination, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      tone="dark"
      heading="Welcome Back!"
      text="Log in to your beneficiary account and continue your journey."
      quote="“Your idea. Your business. Our support.”"
      image={loginWoman}
    >
      <h1 className="text-2xl font-bold text-forest">Login</h1>
      <p className="mb-5 text-sm text-slate-700">Enter your details to access your account.</p>
      {notice && <p role="status" className="mb-4 rounded-lg bg-green-100 p-3 text-sm font-semibold text-green-800">{notice}</p>}
      {serverError && <p role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-sm font-semibold text-red-800">{serverError}</p>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField id="identifier" label="Email or Phone Number" icon={User} placeholder="Enter your email or phone number" autoComplete="username" value={values.identifier} onChange={onChange} error={errors.identifier} />
        <FormField id="password" label="Password" icon={Lock} type="password" placeholder="Enter your password" autoComplete="current-password" value={values.password} onChange={onChange} error={errors.password} />
        <div className="text-right">
          <button type="button" onClick={() => setServerError("Password reset is not available yet.")} className="text-sm font-semibold text-brand">
            Forgot password?
          </button>
        </div>
        <button type="submit" disabled={submitting} className="min-h-12 w-full rounded-lg bg-brand font-semibold text-white disabled:opacity-60">
          {submitting ? "Logging in…" : "Login"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-700">
        Don&rsquo;t have an account? <Link to="/register" className="font-semibold text-brand">Register</Link>
      </p>
      <div className="my-4 flex items-center gap-3 text-xs text-slate-600" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" /> OR <span className="h-px flex-1 bg-slate-200" />
      </div>
      <button type="button" onClick={() => setServerError("Google sign-in is not available yet.")} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-forest">
        <img src={googleIcon} alt="" width="20" height="20" /> Continue with Google
      </button>
    </AuthShell>
  );
}
