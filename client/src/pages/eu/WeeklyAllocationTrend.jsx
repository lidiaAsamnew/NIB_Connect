import { useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { getWeeklyAllocationStream } from "../../services/complianceService.js";
import { ReportState } from "./ComplianceUI.jsx";
import WeeklyAllocationChart from "./WeeklyAllocationChart.jsx";
import { useComplianceData } from "./useComplianceData.js";

export default function WeeklyAllocationTrend() {
  const { startDate, endDate, sector } = useOutletContext();
  const loadWeeklyAllocation = useCallback(() => {
    if (!startDate && !endDate) {
      return getWeeklyAllocationStream();
    }

    return getWeeklyAllocationStream({
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });
  }, [startDate, endDate]);
  const {
    data: weeklyAllocation,
    loading,
    error,
    reload,
  } = useComplianceData(loadWeeklyAllocation);
  const visibleRows = Array.isArray(weeklyAllocation)
    ? weeklyAllocation.filter((row) => !sector || row.marketSector === sector)
    : [];

  return (
    <section className="eu-chart-section" aria-labelledby="weekly-allocation-title">
      <div className="eu-chart-heading">
        <h2 id="weekly-allocation-title">Weekly allocation trend</h2>
        <p>Weekly gross voucher value, socio-economic savings, and cleared value (ETB).</p>
      </div>
      <ReportState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={!visibleRows.length}
      >
        <WeeklyAllocationChart rows={visibleRows} />
      </ReportState>
    </section>
  );
}
