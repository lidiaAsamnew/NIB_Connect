import { getComplianceSummary } from "../../services/complianceService.js";
import { PageHeading, ReportState, SummaryCard } from "./ComplianceUI.jsx";
import { formatMoney } from "./reportUtils.js";
import { useComplianceData } from "./useComplianceData.js";

export default function ComplianceDashboard() {
  const { data, loading, error } = useComplianceData(getComplianceSummary);

  return (
    <section>
      <PageHeading
        eyebrow="Compliance overview"
        title="EU allocation dashboard"
        description="A live summary of orders cleared and voucher value recorded by NIB Connect."
      />
      <ReportState loading={loading} error={error} empty={!data}>
        <div className="eu-summary-grid">
          <SummaryCard label="Total startups" value={data?.startups ?? "-"} />
          <SummaryCard label="Total suppliers" value={data?.suppliers ?? "-"} />
          <SummaryCard label="Verified suppliers" value={data?.verifiedSuppliers ?? "-"} />
          <SummaryCard label="Total orders" value={data?.orders?.total ?? "-"} />
          <SummaryCard label="Total vouchers" value={data?.totalVouchers ?? "-"} />
            {data && (
  <section>
    <h2>Voucher values</h2>
    <p>Allocated: {formatMoney(data.vouchers?.allocatedValue)}</p>
    <p>Committed: {formatMoney(data.vouchers?.committedValue)}</p>
    <p>Settled: {formatMoney(data.vouchers?.settledValue)}</p>

    <h2>Order impact</h2>
    <p>Gross value: {formatMoney(data.impact?.grossValue)}</p>
    <p>Savings: {formatMoney(data.impact?.savings)}</p>
    <p>Cleared value: {formatMoney(data.impact?.clearedValue)}</p>
  </section>
)}
        </div>
      </ReportState>
    </section>
  );
}