import { getRegionReport } from "../../services/complianceService.js";
import { DataTable, PageHeading, ReportState } from "./ComplianceUI.jsx";
import { formatMoney } from "./reportUtils.js";
import { useComplianceData } from "./useComplianceData.js";

const columns = [
  { key: "region", label: "Region" },
  { key: "totalStartups", label: "Total startups" },
  { key: "totalOrders", label: "Total orders" },
  { key: "clearedOrders", label: "Cleared orders" },
  { key: "grossValue", label: "Gross value", render: formatMoney },
  { key: "savings", label: "Savings", render: formatMoney },
  { key: "clearedValue", label: "Cleared value", render: formatMoney },
];

export default function RegionReport() {
  const { data, loading, error } = useComplianceData(getRegionReport);

  return (
    <section>
      <PageHeading
        eyebrow="Geographic distribution"
        title="Region report"
        description="Order volume, savings, and cleared amounts by startup region."
      />
      <ReportState loading={loading} error={error} empty={Array.isArray(data) && data.length === 0}>
        {Array.isArray(data) && <DataTable columns={columns} rows={data} rowKey={(row) => row.region} />}
      </ReportState>
    </section>
  );
}