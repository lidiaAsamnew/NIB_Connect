import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { authService } from "../services/authService";
import { SESSION_EXPIRED_EVENT } from "../services/api";
import { tokenStorage } from "../utils/tokenStorage";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(tokenStorage.getToken()));
  const [error, setError] = useState(null);
  const [sessionMessage, setSessionMessage] = useState("");

  useEffect(() => {
    let active = true;
    const handleSessionExpired = (event) => {
      if (!active) return;
      setUser(null);
      setError(null);
      setSessionMessage(
        event.detail?.message || "Your session has expired. Please login again.",
      );
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    if (!tokenStorage.getToken()) {
      return () => {
        active = false;
        window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
      };
    }

    authService.getCurrentUser()
      .then(({ data }) => {
        if (active) setUser(data);
      })
      .catch((requestError) => {
        if (!active) return;
        const deactivatedMessage = requestError.response?.data?.message ===
          "Your account is deactivated. Contact NIB operations."
          ? requestError.response.data.message
          : null;
        if (requestError.response?.status === 401 || deactivatedMessage) {
          tokenStorage.clearToken();
          setUser(null);
          setSessionMessage(deactivatedMessage || "Your session has expired. Please login again.");
        } else {
          setError(requestError);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);
    setSessionMessage("");
    try {
      const { data } = await authService.login(credentials);
      tokenStorage.setToken(data.accessToken);
      setUser(data.user);
      return data.user;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clearToken();
    setUser(null);
    setError(null);
    setSessionMessage("");
  }, []);

  const value = useMemo(
    () => ({ login, logout, user, isLoading, error, sessionMessage }),
    [login, logout, user, isLoading, error, sessionMessage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
