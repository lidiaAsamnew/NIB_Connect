/**
 * Provisional Week 2 contract supplied by Student 1. This is the only place
 * that maps backend field names to the profile/voucher UI models.
 *
 * @typedef {{id: string, businessName: string, sector: string, region: string, businessDescription?: string | null}} StartupProfileResponse
 * @typedef {{id: string, startupId: string, amount: string | number, status: string, createdAt: string, expiresAt?: string | null}} VoucherResponse
 * @typedef {{success: boolean, data: StartupProfileResponse | null}} ProfileEnvelope
 * @typedef {{success: boolean, data: VoucherResponse[]}} VoucherEnvelope
 */

export const PROFILE_API_CONTRACT = Object.freeze({
  // Keep false until the backend confirms that POST/PATCH accept this field.
  descriptionWritable: false,
  // Enable only if the backend uses 404 to mean "this user has no profile".
  missingProfileIs404: false,
});

export class ContractResponseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ContractResponseError";
  }
}

function unwrapEnvelope(body, moduleName) {
  if (!body || typeof body !== "object" || Array.isArray(body) || body.success !== true || !Object.hasOwn(body, "data")) {
    const message = typeof body?.message === "string" ? body.message : `The server returned an unexpected ${moduleName} response. Please try again.`;
    throw new ContractResponseError(message);
  }
  return body.data;
}

function hasStringFields(value, fields) {
  return value && typeof value === "object" && !Array.isArray(value) && fields.every((field) => typeof value[field] === "string");
}

function isDate(value) {
  return typeof value === "string" && value.trim() !== "" && Number.isFinite(Date.parse(value));
}

export function parseStartupProfileResponse(body) {
  const profile = unwrapEnvelope(body, "startup profile");
  if (profile === null) return null;
  if (!hasStringFields(profile, ["id", "businessName", "sector", "region"]) || !profile.id.trim() ||
      (profile.businessDescription != null && typeof profile.businessDescription !== "string")) {
    throw new ContractResponseError("The server returned unexpected startup profile fields. Please try again.");
  }
  return {
    id: profile.id,
    businessName: profile.businessName,
    sector: profile.sector,
    region: profile.region,
    description: profile.businessDescription ?? "",
  };
}

export function createStartupProfilePayload(values, contract = PROFILE_API_CONTRACT) {
  const payload = {
    businessName: values.businessName.trim(),
    sector: values.sector.trim(),
    region: values.region.trim(),
  };
  if (contract.descriptionWritable) payload.businessDescription = (values.description ?? "").trim();
  return payload;
}

export function parseVouchersResponse(body) {
  const vouchers = unwrapEnvelope(body, "voucher");
  if (!Array.isArray(vouchers)) throw new ContractResponseError("The server returned an unexpected voucher list. Please try again.");
  const ids = new Set();
  return vouchers.map((voucher) => {
    const validAmount = (typeof voucher?.amount === "number" ||
      (typeof voucher?.amount === "string" && /^[+-]?\d+(?:\.\d+)?$/.test(voucher.amount.trim()))) && Number.isFinite(Number(voucher.amount));
    if (!hasStringFields(voucher, ["id", "status"]) || !voucher.id.trim() || !voucher.status.trim() || !validAmount ||
        !isDate(voucher.createdAt) || (voucher.expiresAt != null && !isDate(voucher.expiresAt)) || ids.has(voucher.id)) {
      throw new ContractResponseError("The server returned unexpected voucher fields. Please try again.");
    }
    ids.add(voucher.id);
    return {
      id: voucher.id,
      amount: voucher.amount,
      status: voucher.status,
      allocationDate: voucher.createdAt,
      expiryDate: voucher.expiresAt ?? null,
    };
  });
}

export function getBeneficiaryErrorMessage(error) {
  if (error instanceof ContractResponseError) return error.message;
  const serverMessage = error?.response?.data?.message;
  if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage;
  if (error?.response?.status === 404) return "This service is not available yet. Please try again after it has been enabled.";
  if (error?.code === "ECONNABORTED") return "The request took too long. Please try again.";
  if (error?.request) return "Cannot reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}
