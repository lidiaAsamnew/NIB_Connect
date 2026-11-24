import api from "./api.js";

export const authService = {
  async login(credentials) {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },
  async getCurrentUser() {
    const response = await api.get("/users/me");
    return response.data;
  },
};
