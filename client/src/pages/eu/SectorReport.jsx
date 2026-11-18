import { useCallback, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getSectorReport } from "../../services/complianceService.js";
import { downloadCsv } from "../../utils/csvExport.js";
import { DataTable, PageHeading, ReportState } from "./ComplianceUI.jsx";
import { formatMoney } from "./reportUtils.js";
import { SectorValueChart } from "./ReportCharts.jsx";
import { useComplianceData } from "./useComplianceData.js";

const columns = [
  { key: "sector", label: "Sector" },
  { key: "totalOrders", label: "Total orders" },
  { key: "clearedOrders", label: "Cleared orders" },
  { key: "grossValue", label: "Gross value", render: formatMoney },
  { key: "savings", label: "Savings", render: formatMoney },
  { key: "clearedValue", label: "Cleared value", render: formatMoney },
];

const exportColumns = [
  { key: "sector", label: "Sector" },
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

export default function SectorReport() {
  const { startDate, endDate, sector, region } = useOutletContext();
  const loadSectorReport = useCallback(() => {
    const params = {};

    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (sector?.trim()) params.sector = sector.trim();
    if (region?.trim()) params.region = region.trim();

    return Object.keys(params).length
      ? getSectorReport(params)
      : getSectorReport();
  }, [startDate, endDate, sector, region]);
  const { data, loading, error, reload } = useComplianceData(loadSectorReport);
  const [sortBy, setSortBy] = useState("sector");
  const sortedRows = useMemo(() => {
    if (!Array.isArray(data)) return data;

    return [...data].sort((a, b) => {
      if (sortBy === "clearedValue" || sortBy === "savings") {
        return Number(b[sortBy]) - Number(a[sortBy]);
      }

      return String(a.sector).localeCompare(String(b.sector));
    });
  }, [data, sortBy]);
  const hasRows = Array.isArray(data) && data.length > 0;

  const handleExport = () => {
    if (hasRows) {
      downloadCsv(data, `sector-report-${getLocalDateStamp()}.csv`, exportColumns);
    }
  };

  return (
    <section>
      <PageHeading
        eyebrow="Market distribution"
        title="Sector report"
        description="Order volume, savings, and cleared amounts by startup market sector."
      />
      <div className="eu-pagination">
        <label className="eu-report-sort">
          Sort by
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="sector">Sector name</option>
            <option value="clearedValue">Cleared value</option>
            <option value="savings">Savings</option>
          </select>
        </label>
        <button type="button" onClick={handleExport} disabled={loading || !hasRows}>
          Export CSV
        </button>
      </div>
      <SectorValueChart rows={data} loading={loading} error={error} onRetry={reload} />
      <ReportState loading={loading} error={error} empty={Array.isArray(data) && data.length === 0} onRetry={reload}>
        {Array.isArray(sortedRows) && <DataTable columns={columns} rows={sortedRows} rowKey={(row) => row.sector} />}
      </ReportState>
    </section>
  );
}