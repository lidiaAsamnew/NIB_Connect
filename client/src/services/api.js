
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Temporary local testing only.
// Real authentication will be integrated with the team's AuthContext.
if (import.meta.env.DEV) {
  api.interceptors.request.use((config) => {
    const token = import.meta.env.VITE_DEV_EU_TEST_TOKEN;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });
}

export default api;
