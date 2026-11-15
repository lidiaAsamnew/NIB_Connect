import api from "./api";

export const authService = {
  async register(details) {
    const response = await api.post("/auth/register", details);
    return response.data;
  },
  async login(credentials) {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },
  async getCurrentUser() {
    const response = await api.get("/users/me");
    return response.data;
  },
};
