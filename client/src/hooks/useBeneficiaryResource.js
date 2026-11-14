import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getBeneficiaryErrorMessage } from "../services/beneficiaryContract.js";

export default function useBeneficiaryResource(load) {
  const [resource, setResource] = useState({ status: "loading", data: null, error: "" });
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState(null);
  const { expireSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const reportError = useCallback((error, preserveData = false) => {
    if (error?.code === "ERR_CANCELED" || error?.name === "AbortError") return null;
    if (error?.response?.status === 401) {
      expireSession();
      navigate("/login", { replace: true, state: { from: location, expired: true } });
      return null;
    }
    if (error?.response?.status === 403) {
      setResource({ status: "forbidden", data: null, error: "" });
      return null;
    }
    const message = getBeneficiaryErrorMessage(error);
    if (!preserveData) setResource({ status: "error", data: null, error: message });
    setNotice({ type: "error", message });
    return message;
  }, [expireSession, navigate, location]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    load({ signal: controller.signal })
      .then((data) => {
        if (active) setResource({ status: "ready", data, error: "" });
      })
      .catch((error) => {
        if (active) reportError(error);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [load, attempt, reportError]);

  const retry = useCallback(() => {
    setResource({ status: "loading", data: null, error: "" });
    setNotice(null);
    setAttempt((previous) => previous + 1);
  }, []);
  const replaceData = useCallback((data) => setResource({ status: "ready", data, error: "" }), []);
  const notifySuccess = useCallback((message) => setNotice({ type: "success", message }), []);
  const dismissNotice = useCallback(() => setNotice(null), []);

  return { ...resource, retry, replaceData, reportError, notice, notifySuccess, dismissNotice };
}
