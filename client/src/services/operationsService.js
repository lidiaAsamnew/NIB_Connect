import api from "./api";

async function get(path, params) {
  const cleanParams = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
  const { data } = await api.get(path, { params: cleanParams });
  return data.data;
}

export const operationsService = {
  getDashboard: () => get("/ops/dashboard"),
  listSuppliers: (params) => get("/ops/suppliers", params),
  getSupplier: (id) => get(`/ops/suppliers/${id}`),
  verifySupplier: async (id, remarks) => {
    const { data } = await api.patch(`/ops/suppliers/${id}/verify`, { remarks });
    return data.data;
  },
  unverifySupplier: async (id, remarks) => {
    const { data } = await api.patch(`/ops/suppliers/${id}/unverify`, { remarks });
    return data.data;
  },
  listVouchers: (params) => get("/ops/vouchers", params),
  expireOverdueVouchers: async () => {
    const { data } = await api.post("/ops/vouchers/expire-overdue");
    return data.data;
  },
  listOrders: (params) => get("/ops/orders", params),
  getOrder: (id) => get(`/ops/orders/${id}`),
  getEscrowSummary: () => get("/ops/escrow-summary"),
};
