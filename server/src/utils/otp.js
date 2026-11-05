
import crypto from "crypto";

// Makes a random 6-digit code, e.g. "482915"
export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

// One-way scramble: the same OTP always gives the same hash,
// but you cannot turn the hash back into the OTP.
export function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}