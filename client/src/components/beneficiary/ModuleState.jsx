import { AlertCircle, RefreshCw, Sprout, Ticket } from "lucide-react";

export function ModuleError({ title, message, onRetry }) {
  return (
    <section className="w2-panel w2-empty-state" role="alert">
      <span className="w2-state-icon w2-state-icon--error"><AlertCircle aria-hidden="true" /></span>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && <button type="button" className="w2-button" onClick={onRetry}><RefreshCw aria-hidden="true" /> Try again</button>}
    </section>
  );
}

export function EmptyVouchers() {
  return (
    <section className="w2-panel w2-empty-state">
      <span className="w2-state-icon"><Ticket aria-hidden="true" /></span>
      <h2>No vouchers yet</h2>
      <p>No voucher has been allocated to your startup yet. Please wait for NIB operations to allocate your digital purchase voucher.</p>
    </section>
  );
}

export function ProfileSkeleton() {
  return (
    <section className="w2-panel w2-profile-skeleton" role="status" aria-label="Loading startup profile" aria-busy="true">
      <span className="sr-only">Loading your startup profile…</span>
      <span className="w2-skeleton w2-skeleton--circle" />
      <div className="w2-skeleton-lines">
        <span className="w2-skeleton w2-skeleton--heading" />
        <span className="w2-skeleton" />
        <span className="w2-skeleton" />
        <span className="w2-skeleton w2-skeleton--short" />
      </div>
    </section>
  );
}

export function VoucherSkeleton() {
  return (
    <div role="status" aria-label="Loading vouchers" aria-busy="true">
      <span className="sr-only">Loading your digital vouchers…</span>
      <div className="w2-summary-grid" aria-hidden="true">
        {[0, 1, 2].map((index) => <div key={index} className="w2-panel w2-skeleton-stat"><span className="w2-skeleton w2-skeleton--circle" /><span className="w2-skeleton" /></div>)}
      </div>
      <div className="w2-panel w2-profile-skeleton" aria-hidden="true">
        <span className="w2-skeleton w2-skeleton--circle" />
        <div className="w2-skeleton-lines"><span className="w2-skeleton" /><span className="w2-skeleton" /><span className="w2-skeleton w2-skeleton--short" /></div>
      </div>
    </div>
  );
}

export function LeafAccent() {
  return <Sprout aria-hidden="true" className="w2-leaf-accent" strokeWidth={1.4} />;
}
