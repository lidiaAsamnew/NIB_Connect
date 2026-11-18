import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  getComplianceReportPackage,
  getComplianceReportPackageZip,
  getComplianceSummary,
  getOrderStatusReport,
  getSectorReport,
} from "../../services/complianceService.js";
import { PageHeading, ReportState, SummaryCard } from "./ComplianceUI.jsx";
import { OrdersByStatusChart, SectorValueChart } from "./ReportCharts.jsx";
import { formatMoney } from "./reportUtils.js";
import { useComplianceData } from "./useComplianceData.js";

const WeeklyAllocationTrend = lazy(() => import("./WeeklyAllocationTrend.jsx"));

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function getDownloadErrorMessage(error) {
  const status = error.response?.status;
  let message =
    error.response?.data?.message ||
    error.message ||
    "Please try again.";
  const responseData = error.response?.data;

  if (typeof Blob !== "undefined" && responseData instanceof Blob) {
    const responseText = await responseData.text();

    if (responseText) {
      try {
        message = JSON.parse(responseText)?.message || responseText;
      } catch {
        message = responseText;
      }
    }
  }

  if (status === 401) {
    return `Authorization failed (401). ${message}`;
  }
  if (status === 403) {
    return `Access denied (403). ${message}`;
  }

  return message;
}

export default function ComplianceDashboard() {
  const { startDate, endDate, sector, region } = useOutletContext();
  const {
    data,
    loading,
    error,
    reload,
  } = useComplianceData(getComplianceSummary);
  const loadOrderStatusReport = useCallback(() => {
    const filters = {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(sector ? { sector } : {}),
      ...(region ? { region } : {}),
    };

    return getOrderStatusReport(filters);
  }, [startDate, endDate, sector, region]);
  const {
    data: orderStatusRows,
    loading: orderStatusLoading,
    error: orderStatusError,
    reload: reloadOrderStatuses,
  } = useComplianceData(loadOrderStatusReport);
  const loadSectorReport = useCallback(() => {
    const filters = {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(sector ? { sector } : {}),
      ...(region ? { region } : {}),
    };

    return getSectorReport(filters);
  }, [startDate, endDate, sector, region]);
  const {
    data: sectorRows,
    loading: sectorLoading,
    error: sectorError,
    reload: reloadSectors,
  } = useComplianceData(loadSectorReport);
  const [downloading, setDownloading] = useState({ json: false, zip: false });
  const [downloadError, setDownloadError] = useState("");
  const downloadInProgress = useRef({ json: false, zip: false });

  const handleDownload = async (type) => {
    if (downloadInProgress.current[type]) return;

    downloadInProgress.current[type] = true;
    setDownloading((current) => ({ ...current, [type]: true }));
    setDownloadError("");

    const dateFilters = {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    };
    const zipFilters = {
      ...dateFilters,
      ...(sector?.trim() ? { sector: sector.trim() } : {}),
      ...(region?.trim() ? { region: region.trim() } : {}),
    };

    try {
      if (type === "json") {
        const response = await getComplianceReportPackage(dateFilters);
        const packageDate =
          response.data.generatedAt?.slice(0, 10) ||
          new Date().toISOString().slice(0, 10);
        const json = JSON.stringify(response, null, 2);

        downloadBlob(
          new Blob([json], { type: "application/json;charset=utf-8" }),
          `eu-weekly-sector-package-${packageDate}.json`
        );
      } else {
        const { blob, filename } =
          await getComplianceReportPackageZip(zipFilters);
        downloadBlob(blob, filename);
      }
    } catch (error) {
      const message = await getDownloadErrorMessage(error);
      setDownloadError(`Package download failed: ${message}`);
    } finally {
      downloadInProgress.current[type] = false;
      setDownloading((current) => ({ ...current, [type]: false }));
    }
  };

  return (
    <section>
      <PageHeading
        eyebrow="Compliance overview"
        title="EU allocation dashboard"
        description="A live summary of orders cleared and voucher value recorded by NIB Connect."
      />
      <section className="eu-package-actions" aria-labelledby="eu-package-heading">
        <h2 id="eu-package-heading">Verifiable report packages</h2>
        <div className="eu-package-buttons">
          <button
            type="button"
            onClick={() => handleDownload("json")}
            disabled={downloading.json}
            aria-busy={downloading.json}
          >
            {downloading.json ? "Preparing JSON..." : "Download JSON Package"}
          </button>
          <button
            type="button"
            onClick={() => handleDownload("zip")}
            disabled={downloading.zip}
            aria-busy={downloading.zip}
          >
            {downloading.zip ? "Preparing ZIP..." : "Download ZIP Report"}
          </button>
        </div>
        {(downloading.json || downloading.zip) && (
          <p className="eu-package-status" role="status">
            Preparing {downloading.json && downloading.zip
              ? "the JSON and ZIP packages"
              : downloading.json
                ? "the JSON package"
                : "the ZIP report"}
            ...
          </p>
        )}
        {downloadError && (
          <div className="eu-state eu-state-error eu-package-error" role="alert">
            <strong>Unable to download report package</strong>
            <span>{downloadError}</span>
          </div>
        )}
      </section>
      <ReportState loading={loading} error={error} empty={!data} onRetry={reload}>
        <div className="eu-summary-grid">
          <SummaryCard label="Total Startups" value={data?.startups ?? "-"} />
          <SummaryCard label="Total Suppliers" value={data?.suppliers ?? "-"} />
          <SummaryCard label="Verified Suppliers" value={data?.verifiedSuppliers ?? "-"} />
          <SummaryCard
            label="Total Voucher Value Allocated"
            value={formatMoney(data?.vouchers?.allocatedValue)}
          />
          <SummaryCard
            label="Total Committed Value"
            value={formatMoney(data?.vouchers?.committedValue)}
          />
          <SummaryCard
            label="Total Settled Value"
            value={formatMoney(data?.vouchers?.settledValue)}
          />
          <SummaryCard label="Total Orders" value={data?.orders?.total ?? "-"} />
          <SummaryCard
            label="Cleared Orders"
            value={data?.orders?.VERIFIED_AND_CLEARED ?? "-"}
          />
          <SummaryCard
            label="Pending Handshake Orders"
            value={data?.orders?.DELIVERED_PENDING_HANDSHAKE ?? "-"}
          />
          <SummaryCard
            label="Socio-Economic Savings"
            value={formatMoney(data?.impact?.savings)}
          />
        </div>
      </ReportState>
      <div className="eu-chart-grid">
        <OrdersByStatusChart
          rows={orderStatusRows}
          loading={orderStatusLoading}
          error={orderStatusError}
          onRetry={reloadOrderStatuses}
        />
        <SectorValueChart
          rows={sectorRows}
          loading={sectorLoading}
          error={sectorError}
          onRetry={reloadSectors}
        />
      </div>
      <Suspense fallback={<div className="eu-state" role="status">Loading chart...</div>}>
        <WeeklyAllocationTrend />
      </Suspense>
    </section>
  );
}