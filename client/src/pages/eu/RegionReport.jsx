import { useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { getRegionReport } from "../../services/complianceService.js";
import { downloadCsv } from "../../utils/csvExport.js";
import { DataTable, PageHeading, ReportState } from "./ComplianceUI.jsx";
import { formatMoney } from "./reportUtils.js";
import { RegionValueChart } from "./ReportCharts.jsx";
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

const exportColumns = [
  { key: "region", label: "Region" },
  { key: "totalStartups", label: "Total Startups" },
  { key: "totalOrders", label: "Total Orders" },
  { key: "clearedOrders", label: "Cleared Orders" },
  { key: "grossValue", label: "Gross Value" },
  { key: "savings", label: "Savings" },
  { key: "clearedValue", label: "Cleared Value" },
];

function getLocalDateStamp() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export default function RegionReport() {
  const { startDate, endDate, sector, region } = useOutletContext();
  const loadRegionReport = useCallback(() => {
    const params = {};

    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (sector?.trim()) params.sector = sector.trim();
    if (region?.trim()) params.region = region.trim();

    return Object.keys(params).length
      ? getRegionReport(params)
      : getRegionReport();
  }, [startDate, endDate, sector, region]);
  const { data, loading, error, reload } = useComplianceData(loadRegionReport);
  const hasRows = Array.isArray(data) && data.length > 0;

  const handleExport = () => {
    if (hasRows) {
      downloadCsv(data, `region-report-${getLocalDateStamp()}.csv`, exportColumns);
    }
  };

  return (
    <section>
      <PageHeading
        eyebrow="Geographic distribution"
        title="Region report"
        description="Order volume, savings, and cleared amounts by startup region."
      />
      <div className="eu-pagination">
        <button type="button" onClick={handleExport} disabled={loading || !hasRows}>
          Export CSV
        </button>
      </div>
      <RegionValueChart rows={data} />
      <ReportState loading={loading} error={error} empty={Array.isArray(data) && data.length === 0} onRetry={reload}>
        {Array.isArray(data) && <DataTable columns={columns} rows={data} rowKey={(row) => row.region} />}
      </ReportState>
    </section>
  );
}