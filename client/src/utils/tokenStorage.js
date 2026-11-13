const TOKEN_KEY = "nib-connect-access-token";

function getStorage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

export const tokenStorage = {
  getToken() {
    return getStorage()?.getItem(TOKEN_KEY) || null;
  },
  setToken(token) {
    getStorage()?.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    getStorage()?.removeItem(TOKEN_KEY);
  },
};
