import { useId, useState } from "react";
import { ArrowRight, CalendarDays, ChevronUp, Gift, LockKeyhole } from "lucide-react";
import StatusBadge from "../StatusBadge";

export default function VoucherCard({ id, amount, status, allocationDate, expiryDate, availability }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  return (
    <article className={`w2-panel w2-voucher-card ${availability.expired ? "w2-voucher-card--expired" : ""}`} aria-label={`Voucher ${id}`}>
      <div className="w2-voucher-art" aria-hidden="true"><div className="w2-gift-ticket"><Gift strokeWidth={1.6} /></div></div>
      <div className="w2-voucher-content">
        <dl className="w2-voucher-facts">
          <div><dt>Voucher ID</dt><dd className="w2-voucher-id">{id}</dd></div>
          <div><dt>Amount</dt><dd>{amount}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge status={status} />{availability.expired && <span className="w2-expired-badge">Expired</span>}</dd></div>
        </dl>
        <div className="w2-voucher-dates">
          <p><CalendarDays aria-hidden="true" /><span>Allocated: <time>{allocationDate}</time></span></p>
          {expiryDate && <p><CalendarDays aria-hidden="true" /><span>Expires: <time>{expiryDate}</time></span></p>}
        </div>
        <div className="w2-voucher-footer">
          <p className={`w2-availability ${availability.usable ? "w2-availability--usable" : ""}`}>
            {!availability.usable && <LockKeyhole aria-hidden="true" />}{availability.message}
          </p>
          <button type="button" className="w2-button w2-details-button" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded((previous) => !previous)}>
            {expanded ? "Hide Details" : "View Details"}{expanded ? <ChevronUp aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          </button>
        </div>
          <div id={detailsId} className="w2-voucher-details" hidden={!expanded}>
            <h3>Voucher details</h3>
            <p><strong>Current status:</strong> <span className="w2-status-value">{status}</span></p>
            <p>{availability.message}</p>
            {!expiryDate && <p>No expiry date has been provided for this voucher.</p>}
          </div>
      </div>
    </article>
  );
}
