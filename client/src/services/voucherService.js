import api from "./api.js";
import { parseVouchersResponse } from "./beneficiaryContract.js";

export async function getMyVouchers({ signal } = {}) {
  const { data } = await api.get("/vouchers/me", { signal });
  return parseVouchersResponse(data);
}
