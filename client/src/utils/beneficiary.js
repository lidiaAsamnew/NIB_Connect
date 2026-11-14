export const STARTUP_SECTORS = ["Agriculture", "Manufacturing", "Retail", "Services", "Tech"];
export const STARTUP_REGIONS = ["Addis Ababa", "Amhara", "Oromia", "Tigray", "SNNPR", "Sidama"];

export const VOUCHER_STATUSES = {
  ALLOCATED: "ALLOCATED",
  COMMITTED: "COMMITTED_TO_ORDER",
  SETTLED: "REDEEMED_AND_SETTLED",
};

export function validateStartupProfile(values, supportsDescription = false) {
  const errors = {};
  if (!values.businessName?.trim()) errors.businessName = "Enter your business name.";
  if (!values.sector?.trim()) errors.sector = "Select your business sector.";
  if (!values.region?.trim()) errors.region = "Select your business region.";
  if (supportsDescription && (values.description?.length ?? 0) > 500) {
    errors.description = "Keep your business description to 500 characters or fewer.";
  }
  return errors;
}

// These rules take individual values so they do not impose a backend response schema.
export function getVoucherAvailability(status, expiry, now = Date.now()) {
  const expiryTime = expiry !== null && expiry !== undefined ? new Date(expiry).getTime() : null;
  const expired = expiryTime !== null && Number.isFinite(expiryTime) && expiryTime <= now;

  if (status === VOUCHER_STATUSES.COMMITTED) {
    return { usable: false, expired, message: "This voucher is currently locked to an order and cannot be reused." };
  }
  if (status === VOUCHER_STATUSES.SETTLED) {
    return { usable: false, expired, message: "This voucher has been settled and cannot be used again." };
  }
  if (expiryTime !== null && !Number.isFinite(expiryTime)) {
    return { usable: false, expired: false, message: "The expiry date cannot be verified. This voucher is not available for new orders." };
  }
  if (expired) {
    return { usable: false, expired: true, message: "This voucher has expired and cannot be used for new orders." };
  }
  if (status === VOUCHER_STATUSES.ALLOCATED) {
    return { usable: true, expired: false, message: "Available to use for a new order." };
  }
  return { usable: false, expired: false, message: "This voucher is not available for new orders." };
}

export function formatVoucherDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatVoucherAmount(value, currency) {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "") || !Number.isFinite(Number(value))) return "Not provided";
  const amount = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(Number(value));
  return currency ? `${currency} ${amount}` : amount;
}
