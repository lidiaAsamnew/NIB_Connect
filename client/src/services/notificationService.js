import api from "./api";

async function get(path, params) {
  const cleanParams = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  );
  const response = await api.get(path, { params: cleanParams });
  return response.data.data;
}

export const notificationService = {
  list: (params) => get("/notifications", params),
  markRead: async (id) => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.data;
  },
  markAllRead: async () => {
    const { data } = await api.patch("/notifications/read-all");
    return data.data;
  },
};

export function announceNotificationsUpdated() {
  window.dispatchEvent(new Event("nib-notifications-updated"));
}
