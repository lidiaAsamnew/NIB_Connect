import { BadgeCheck, ShoppingCart, Ticket } from "lucide-react";

const SUMMARIES = [
  { key: "allocated", label: "Allocated", caption: "Available if unexpired", Icon: Ticket, tone: "allocated" },
  { key: "committed", label: "Committed", caption: "Locked to an order", Icon: ShoppingCart, tone: "committed" },
  { key: "settled", label: "Settled", caption: "Completed & closed", Icon: BadgeCheck, tone: "settled" },
];

export default function VoucherSummary({ counts }) {
  return (
    <section className="w2-summary-grid" aria-label="Voucher status summary">
      {SUMMARIES.map(({ key, label, caption, Icon, tone }) => (
        <div key={key} className={`w2-panel w2-summary-card w2-summary-card--${tone}`}>
          <span className="w2-summary-icon"><Icon aria-hidden="true" /></span>
          <div><p className="w2-summary-number">{counts[key]}</p><h2>{label}</h2><p className="w2-summary-caption">{caption}</p></div>
        </div>
      ))}
    </section>
  );
}
