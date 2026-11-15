import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";
import { getToken, removeToken, setToken } from "../utils/tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(getToken()));
  const [sessionExpired, setSessionExpired] = useState(false);

  // Restore the session after a page refresh.
  useEffect(() => {
    if (!getToken()) return undefined;
    let active = true;
    authService
      .getMe()
      .then((me) => active && setUser(me))
      .catch((error) => {
        if (active) {
          removeToken();
          setSessionExpired(error?.response?.status === 401);
        }
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { accessToken, user: me } = await authService.login(identifier, password);
    setToken(accessToken);
    setUser(me);
    setSessionExpired(false);
    return me;
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setSessionExpired(false);
  }, []);

  const expireSession = useCallback(() => {
    removeToken();
    setUser(null);
    setSessionExpired(true);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: Boolean(user), sessionExpired, login, logout, expireSession }),
    [user, isLoading, sessionExpired, login, logout, expireSession]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
