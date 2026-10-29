import { useEffect, useState } from "react";
import { checkHealth } from "../services/healthService";

export const HEALTH_TEXT = {
  loading: "Checking backend…",
  ok: "Backend connected successfully",
  error: "Backend connection failed",
};

export default function useBackendStatus() {
  const [state, setState] = useState("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    checkHealth()
      .then(() => active && setState("ok"))
      .catch(() => active && setState("error"));
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = () => {
    setState("loading");
    setAttempt((n) => n + 1);
  };
  return { state, retry };
}
