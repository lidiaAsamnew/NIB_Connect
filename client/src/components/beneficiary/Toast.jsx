import { useEffect } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";

export default function Toast({ notice, onClose }) {
  useEffect(() => {
    if (!notice || notice.type === "error") return undefined;
    const timeout = setTimeout(onClose, 6000);
    return () => clearTimeout(timeout);
  }, [notice, onClose]);

  if (!notice) return null;
  const Icon = notice.type === "error" ? CircleAlert : CircleCheck;
  return (
    <div className={`w2-toast w2-toast--${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
      <Icon aria-hidden="true" />
      <p>{notice.message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss message"><X aria-hidden="true" /></button>
    </div>
  );
}
