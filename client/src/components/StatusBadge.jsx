// Keep the exact blueprint values in the data. Only the label shown to the user is friendly.
const STATUS = {
  ALLOCATED: ["Allocated", "bg-green-100 text-green-800"],
  COMMITTED_TO_ORDER: ["Committed to order", "bg-orange-100 text-orange-800"],
  REDEEMED_AND_SETTLED: ["Redeemed and settled", "bg-blue-100 text-blue-800"],
  PLACED: ["Placed", "bg-blue-100 text-blue-800"],
  DISPATCHED_IN_TRANSIT: ["Dispatched", "bg-orange-100 text-orange-800"],
  DELIVERED_PENDING_HANDSHAKE: ["Delivered, pending OTP", "bg-amber-100 text-amber-900"],
  VERIFIED_AND_CLEARED: ["Cleared", "bg-green-100 text-green-800"],
};

export default function StatusBadge({ status }) {
  const [label, style] = STATUS[status] ?? [status, "bg-slate-100 text-slate-800"];
  return (
    <span title={status} className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}
