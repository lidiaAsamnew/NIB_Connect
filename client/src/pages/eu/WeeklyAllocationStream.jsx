import { useCallback, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getWeeklyAllocationStream } from "../../services/complianceService.js";
import { downloadCsv } from "../../utils/csvExport.js";
import { DataTable, PageHeading, ReportState } from "./ComplianceUI.jsx";
import { formatMoney } from "./reportUtils.js";
import WeeklyAllocationChart from "./WeeklyAllocationChart.jsx";
import { useComplianceData } from "./useComplianceData.js";

const columns = [
  { key: "euReportingWeek", label: "Reporting week" },
  { key: "marketSector", label: "Market sector" },
  { key: "grossVoucherValueETB", label: "Gross voucher value", render: formatMoney },
  { key: "socioEconomicSavingsETB", label: "Socio-economic savings", render: formatMoney },
  { key: "clearedETB", label: "Cleared value", render: formatMoney },
];

const exportColumns = [
  { key: "euReportingWeek", label: "Week" },
  { key: "marketSector", label: "Sector" },
  { key: "grossVoucherValueETB", label: "Gross Voucher Value" },
  { key: "socioEconomicSavingsETB", label: "Socio-economic Savings" },
  { key: "clearedETB", label: "Cleared Value" },
];

function getLocalDateStamp() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export default function WeeklyAllocationStream() {
  const { startDate, endDate, sector } = useOutletContext();
  const [view, setView] = useState("table");
  const loadWeeklyAllocation = useCallback(() => {
    if (!startDate && !endDate) {
      return getWeeklyAllocationStream();
    }

    return getWeeklyAllocationStream({
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });
  }, [startDate, endDate]);
  const { data, loading, error, reload } = useComplianceData(loadWeeklyAllocation);
  const visibleRows = Array.isArray(data)
    ? data.filter((row) => !sector || row.marketSector === sector)
    : [];
  const hasRows = visibleRows.length > 0;

  const handleExport = () => {
    if (hasRows) {
      downloadCsv(
        visibleRows,
        `weekly-allocation-${getLocalDateStamp()}.csv`,
        exportColumns
      );
    }
  };

  return (
    <section>
      <PageHeading
        eyebrow="Allocation stream"
        title="Weekly allocation"
        description="Order allocation and cleared values grouped by reporting week and market sector."
      />
      <div className="eu-pagination">
        <div className="eu-view-toggle" role="group" aria-label="Weekly allocation view">
          <button
            type="button"
            aria-pressed={view === "table"}
            onClick={() => setView("table")}
          >
            Table
          </button>
          <button
            type="button"
            aria-pressed={view === "chart"}
            onClick={() => setView("chart")}
          >
            Chart
          </button>
        </div>
        <button type="button" onClick={handleExport} disabled={loading || !hasRows}>
          Export CSV
        </button>
      </div>
      <ReportState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={Array.isArray(data) && visibleRows.length === 0}
      >
        {view === "table" && Array.isArray(data) && (
          <DataTable columns={columns} rows={visibleRows} rowKey={(row) => `${row.euReportingWeek}-${row.marketSector}`} />
        )}
        {view === "chart" && Array.isArray(data) && (
          <WeeklyAllocationChart rows={visibleRows} />
        )}
      </ReportState>
    </section>
  );
}