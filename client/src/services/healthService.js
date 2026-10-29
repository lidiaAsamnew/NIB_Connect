import api from "./api";

export async function checkHealth() {
  const { data } = await api.get("/health");
  return data;
}
