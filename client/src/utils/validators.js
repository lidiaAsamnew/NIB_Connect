export const MIN_PASSWORD = 8;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ET_PHONE = /^(?:\+251|251|0)[79]\d{8}$/;
const clean = (v) => v.replace(/[\s-]/g, "");

export const isEmail = (v) => EMAIL.test(v.trim());
export const isEthiopianPhone = (v) => ET_PHONE.test(clean(v));

export function toE164(v) {
  const s = clean(v);
  if (s.startsWith("+251")) return s;
  if (s.startsWith("251")) return `+${s}`;
  if (s.startsWith("0")) return `+251${s.slice(1)}`;
  return s;
}

export const toE164IfPhone = (v) => (isEthiopianPhone(v) ? toE164(v) : v.trim());

export function validateLogin({ identifier, password }) {
  const errors = {};
  if (!identifier.trim()) errors.identifier = "Enter your email or phone number.";
  else if (!isEmail(identifier) && !isEthiopianPhone(identifier))
    errors.identifier = "Enter a valid email or Ethiopian phone number.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

export function validateRegister(v) {
  const errors = {};
  if (!v.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!v.email.trim()) errors.email = "Enter your email.";
  else if (!isEmail(v.email)) errors.email = "Enter a valid email address.";
  if (!v.phoneNumber.trim()) errors.phoneNumber = "Enter your phone number.";
  else if (!isEthiopianPhone(v.phoneNumber))
    errors.phoneNumber = "Use an Ethiopian number like +251911234567 or 0911234567.";
  if (!v.password) errors.password = "Enter a password.";
  else if (v.password.length < MIN_PASSWORD)
    errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  if (!v.confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (v.confirmPassword !== v.password) errors.confirmPassword = "Passwords do not match.";
  return errors;
}
