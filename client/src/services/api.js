import axios from "axios";
import { tokenStorage } from "../utils/tokenStorage";

export const SESSION_EXPIRED_EVENT = "nib-session-expired";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
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
    const config = error.config;
    const authorization = config?.headers?.Authorization
      || config?.headers?.get?.("Authorization");
    const isLoginRequest = config?.url?.split("?")[0].endsWith("/auth/login");
    const isDeactivatedAccount = error.response?.status === 403
      && error.response?.data?.message === "Your account is deactivated. Contact NIB operations.";
    const sessionMessage = isDeactivatedAccount
      ? error.response.data.message
      : "Your session has expired. Please login again.";

    if (
      (error.response?.status === 401 || isDeactivatedAccount) &&
      authorization &&
      !isLoginRequest
    ) {
      tokenStorage.clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, {
          detail: { message: sessionMessage },
        }));
      }
    }
    return Promise.reject(error);
  },
);

export default api;
