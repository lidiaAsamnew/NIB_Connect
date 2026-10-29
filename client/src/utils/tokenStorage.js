const KEY = "nib_access_token";

export function getToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* storage unavailable: the user will log in again next time */
  }
}

export function removeToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to remove */
  }
}
