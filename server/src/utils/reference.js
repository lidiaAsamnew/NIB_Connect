import crypto from "crypto";

// generateReference("ESC") gives something like "ESC-1761500000000-A1B2C3D4"
export function generateReference(prefix) {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}