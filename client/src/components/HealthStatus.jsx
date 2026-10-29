import useBackendStatus, { HEALTH_TEXT } from "../hooks/useBackendStatus";

const STYLES = {
  loading: "bg-slate-100 text-slate-800",
  ok: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

export default function HealthStatus() {
  const { state, retry } = useBackendStatus();
  return (
    <div role="status" className={`inline-flex items-center gap-3 rounded-full px-4 py-1.5 text-sm font-semibold ${STYLES[state]}`}>
      {HEALTH_TEXT[state]}
      {state === "error" && (
        <button type="button" onClick={retry} className="underline">Retry</button>
      )}
    </div>
  );
}
