import api from "./api.js";

function ensureApiConfigured() {
  if (!import.meta.env.VITE_API_BASE_URL?.trim()) {
    throw new Error("VITE_API_BASE_URL is not configured. Set it to the backend base URL ending in /api.");
  }
}

function unwrapReport(response) {
  if (!response.data?.success || response.data.data === undefined) {
    throw new Error(response.data?.message || "Unexpected compliance API response.");
  }

  return response.data.data;
}

async function getReport(path, params) {
  ensureApiConfigured();
  const response = await api.get(path, { params });
  return unwrapReport(response);
}

export const getComplianceSummary = () => getReport("/compliance/summary");
export const getWeeklyAllocationStream = (params) =>
  getReport("/compliance/weekly-allocation-stream", params);
export const getSectorReport = (params) =>
  getReport("/compliance/sector-report", params);
export const getRegionReport = (params) =>
  getReport("/compliance/region-report", params);

async function getPaginatedReport(path, resourceName, params) {
  ensureApiConfigured();
  const response = await api.get(path, { params });
  const records = unwrapReport(response);

  if (!Array.isArray(records)) {
    throw new Error(`Unexpected ${resourceName} response: expected an array of records.`);
  }

  return {
    records,
    pagination: response.data.meta?.pagination,
  };
}

export const getOrders = (params) =>
  getPaginatedReport("/compliance/orders", "orders", params);
export const getVouchers = (params) =>
  getPaginatedReport("/compliance/vouchers", "vouchers", params);
export const getEscrowTransactions = (params) =>
  getPaginatedReport("/compliance/escrow-transactions", "escrow transactions", params);