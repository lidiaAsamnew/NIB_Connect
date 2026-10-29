import api from "./api";
import { getToken } from "../utils/tokenStorage";

// Mock mode is for local development only, while the backend is not ready.
const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_AUTH === "true";
const MOCK_TOKEN = "mock-token";
const wait = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));
const mockUser = (extra = {}) => ({
  id: "mock-user-1",
  fullName: "Demo Startup Owner",
  email: "demo@example.com",
  phoneNumber: "+251900000000",
  role: "WOMEN_STARTUP_OWNER",
  isActive: true,
  ...extra,
});

export async function register(payload) {
  if (USE_MOCK) {
    await wait();
    return mockUser({ fullName: payload.fullName, email: payload.email, phoneNumber: payload.phoneNumber });
  }
  const { data } = await api.post("/auth/register", payload);
  return data.data;
}

export async function login(identifier, password) {
  if (USE_MOCK) {
    await wait();
    return { accessToken: MOCK_TOKEN, user: mockUser() };
  }
  const { data } = await api.post("/auth/login", { identifier, password });
  return data.data;
}

export async function getMe() {
  if (USE_MOCK) {
    await wait(200);
    if (getToken() !== MOCK_TOKEN) throw new Error("Invalid mock session");
    return mockUser();
  }
  const { data } = await api.get("/users/me");
  return data.data;
}

export function getErrorMessage(err) {
  const fromServer = err?.response?.data?.message;
  if (fromServer) return fromServer;
  if (err?.request) return "Cannot reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}
