import { getWeeklyAllocationStream } from "../../services/complianceService.js";
import { DataTable, PageHeading, ReportState } from "./ComplianceUI.jsx";
import { formatMoney } from "./reportUtils.js";
import { useComplianceData } from "./useComplianceData.js";

const columns = [
  { key: "euReportingWeek", label: "Reporting week" },
  { key: "marketSector", label: "Market sector" },
  { key: "grossVoucherValueETB", label: "Gross voucher value", render: formatMoney },
  { key: "socioEconomicSavingsETB", label: "Socio-economic savings", render: formatMoney },
  { key: "clearedETB", label: "Cleared value", render: formatMoney },
];

export default function WeeklyAllocationStream() {
  const { data, loading, error } = useComplianceData(getWeeklyAllocationStream);

  return (
    <section>
      <PageHeading
        eyebrow="Allocation stream"
        title="Weekly allocation"
        description="Order allocation and cleared values grouped by reporting week and market sector."
      />
      <ReportState loading={loading} error={error} empty={Array.isArray(data) && data.length === 0}>
        {Array.isArray(data) && <DataTable columns={columns} rows={data} rowKey={(row) => `${row.euReportingWeek}-${row.marketSector}`} />}
      </ReportState>
    </section>
  );
}