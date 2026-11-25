import api from "./api";

export const securityEventService = {
  async list(params) {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([, value]) => value !== "" && value !== undefined && value !== null),
    );
    const response = await api.get("/security-events", { params: cleanParams });
    return response.data.data;
  },
};
