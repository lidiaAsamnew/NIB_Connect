import { Check, Lightbulb } from "lucide-react";
import { LeafAccent } from "./ModuleState";

export default function VoucherRules({ hasExpiry }) {
  return (
    <section className="w2-voucher-rules" aria-labelledby="voucher-rules-title">
      <Lightbulb aria-hidden="true" className="w2-rules-icon" />
      <div>
        <h2 id="voucher-rules-title">Voucher Rules</h2>
        <ul>
          <li><Check aria-hidden="true" /><span>Only <strong>ALLOCATED</strong> vouchers can be used for new orders.</span></li>
          <li><Check aria-hidden="true" /><span><strong>COMMITTED_TO_ORDER</strong> vouchers cannot be reused.</span></li>
          <li><Check aria-hidden="true" /><span><strong>REDEEMED_AND_SETTLED</strong> vouchers are closed.</span></li>
          {hasExpiry && <li><Check aria-hidden="true" /><span>Expired vouchers cannot be used for new orders.</span></li>}
        </ul>
      </div>
      <LeafAccent />
    </section>
  );
}
