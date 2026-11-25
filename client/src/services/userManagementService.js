import api from "./api";

async function get(path, params) {
  const cleanParams = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
  const response = await api.get(path, { params: cleanParams });
  return response.data.data;
}

export const userManagementService = {
  list: (params) => get("/ops/users", params),
  get: (id) => get(`/ops/users/${id}`),
  activate: async (id) => {
    const { data } = await api.patch(`/ops/users/${id}/activate`);
    return data;
  },
  deactivate: async (id) => {
    const { data } = await api.patch(`/ops/users/${id}/deactivate`);
    return data;
  },
};
