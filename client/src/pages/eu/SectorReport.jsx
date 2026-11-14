import { getSectorReport } from "../../services/complianceService.js";
import { DataTable, PageHeading, ReportState } from "./ComplianceUI.jsx";
import { formatMoney } from "./reportUtils.js";
import { useComplianceData } from "./useComplianceData.js";

const columns = [
  { key: "sector", label: "Sector" },
  { key: "totalOrders", label: "Total orders" },
  { key: "clearedOrders", label: "Cleared orders" },
  { key: "grossValue", label: "Gross value", render: formatMoney },
  { key: "savings", label: "Savings", render: formatMoney },
  { key: "clearedValue", label: "Cleared value", render: formatMoney },
];

export default function SectorReport() {
  const { data, loading, error } = useComplianceData(getSectorReport);

  return (
    <section>
      <PageHeading
        eyebrow="Market distribution"
        title="Sector report"
        description="Order volume, savings, and cleared amounts by startup market sector."
      />
      <ReportState loading={loading} error={error} empty={Array.isArray(data) && data.length === 0}>
        {Array.isArray(data) && <DataTable columns={columns} rows={data} rowKey={(row) => row.sector} />}
      </ReportState>
    </section>
  );
}