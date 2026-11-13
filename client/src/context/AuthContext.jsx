import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { tokenStorage } from "../utils/tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    if (!tokenStorage.getToken()) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    authService.getCurrentUser()
      .then(({ data }) => {
        if (active) setUser(data);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.response?.status === 401) {
          tokenStorage.clearToken();
        }
        setError(requestError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);
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
  }, []);

  const value = useMemo(
    () => ({ login, logout, user, isLoading, error }),
    [login, logout, user, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
