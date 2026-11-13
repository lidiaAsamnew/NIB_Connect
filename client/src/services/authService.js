import axios from "axios";
import { tokenStorage } from "../utils/tokenStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clearToken();
    }
    return Promise.reject(error);
  },
);

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
