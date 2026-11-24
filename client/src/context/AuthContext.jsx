import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "../services/authService.js";
import AuthContext from "./authContext.js";
import {
  AUTH_UNAUTHORIZED_EVENT,
  tokenStorage,
} from "../utils/tokenStorage.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(tokenStorage.getToken()));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const handleUnauthorized = () => {
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

    if (tokenStorage.getToken()) {
      authService.getCurrentUser()
        .then((response) => {
          if (!response?.success || !response.data) {
            throw new Error(response?.message || "Unexpected current-user response.");
          }
          if (active) {
            setUser(response.data);
            setError(null);
          }
        })
        .catch((requestError) => {
          if (requestError.response?.status === 401) {
            tokenStorage.clearToken();
          }
          if (active) {
            setUser(null);
            setError(requestError);
          }
        })
        .finally(() => {
          if (active) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      active = false;
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      const { accessToken, user: signedInUser } = response?.data || {};
      if (!response?.success || !accessToken || !signedInUser) {
        throw new Error(response?.message || "Unexpected login response.");
      }
      tokenStorage.setToken(accessToken);
      setUser(signedInUser);
      return signedInUser;
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