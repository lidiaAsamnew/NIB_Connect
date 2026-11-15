import api from "./api";

export const auditService = {
  async list(params) {
    const response = await api.get("/audit-logs", { params });
    return response.data.data;
  },
};
