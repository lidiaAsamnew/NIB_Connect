import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Phone, User, UserCheck } from "lucide-react";
import { registerWoman } from "../assets";
import AuthShell from "../components/AuthShell";
import FormField from "../components/FormField";
import { getErrorMessage, register } from "../services/authService";
import { ROLES } from "../utils/constants";
import { toE164, validateRegister } from "../utils/validators";

const EMPTY = { fullName: "", email: "", phoneNumber: "", password: "", confirmPassword: "" };

export default function Register() {
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validateRegister(values);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      // The role is fixed in code and never read from the form.
      await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phoneNumber: toE164(values.phoneNumber),
        password: values.password,
        role: ROLES.STARTUP_OWNER,
      });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      tone="light"
      heading="Create Your Account"
      text="Join NIB-Connect and start growing your business."
      quote="Empowering women entrepreneurs"
      image={registerWoman}
    >
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-forest">Register</h1>
        <p className="mb-5 text-sm text-slate-700">Fill in your information to create your account.</p>
      </div>
      {serverError && <p role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-sm font-semibold text-red-800">{serverError}</p>}
      <form onSubmit={onSubmit} noValidate className="space-y-3.5">
        <FormField id="fullName" label="Full Name" icon={User} placeholder="Enter your full name" autoComplete="name" value={values.fullName} onChange={onChange} error={errors.fullName} />
        <FormField id="email" label="Email Address" icon={Mail} type="email" placeholder="Enter your email address" autoComplete="email" value={values.email} onChange={onChange} error={errors.email} />
        <FormField id="phoneNumber" label="Phone Number" icon={Phone} type="tel" placeholder="+251 912 345 678" autoComplete="tel" value={values.phoneNumber} onChange={onChange} error={errors.phoneNumber} />
        <FormField id="password" label="Password" icon={Lock} type="password" placeholder="Enter your password" autoComplete="new-password" value={values.password} onChange={onChange} error={errors.password} />
        <FormField id="confirmPassword" label="Confirm Password" icon={Lock} type="password" placeholder="Confirm your password" autoComplete="new-password" value={values.confirmPassword} onChange={onChange} error={errors.confirmPassword} />
        <FormField id="role" label="Role" icon={UserCheck} as="select" defaultValue={ROLES.STARTUP_OWNER}>
          <option value={ROLES.STARTUP_OWNER}>{ROLES.STARTUP_OWNER} (Default)</option>
        </FormField>
        <button type="submit" disabled={submitting} className="min-h-12 w-full rounded-lg bg-brand font-semibold text-white disabled:opacity-60">
          {submitting ? "Creating account…" : "Register"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-700">
        Already have an account? <Link to="/login" className="font-semibold text-brand">Login</Link>
      </p>
    </AuthShell>
  );
}
