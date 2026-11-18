import { useCallback, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getVouchers } from "../../services/complianceService.js";
import { downloadCsv } from "../../utils/csvExport.js";
import { DataTable, PageHeading, ReportState } from "./ComplianceUI.jsx";
import { formatDate, formatMoney } from "./reportUtils.js";
import { useComplianceData } from "./useComplianceData.js";

const columns = [
  { key: "id", label: "Voucher ID" },
  { key: "startup", label: "Startup", render: (startup) => startup?.businessName ?? "-" },
  { key: "amount", label: "Value", render: formatMoney },
  { key: "status", label: "Status" },
  { key: "sector", label: "Sector", render: (_, row) => row.startup?.sector ?? "-" },
  { key: "region", label: "Region", render: (_, row) => row.startup?.region ?? "-" },
  { key: "expiresAt", label: "Expires", render: formatDate },
  { key: "createdAt", label: "Created", render: formatDate },
];

const exportColumns = [
  { key: "id", label: "Voucher ID" },
  { key: "startup", label: "Startup" },
  { key: "amount", label: "Value" },
  { key: "status", label: "Status" },
  { key: "sector", label: "Sector" },
  { key: "region", label: "Region" },
  { key: "expiresAt", label: "Expires" },
  { key: "createdAt", label: "Created" },
];

function buildVoucherParams(page, pageSize, filters) {
  const params = { page, pageSize };

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.sector?.trim()) params.sector = filters.sector.trim();
  if (filters.region?.trim()) params.region = filters.region.trim();
  if (filters.status) params.status = filters.status;
  if (filters.startupId?.trim()) params.startupId = filters.startupId.trim();

  return params;
}

function getLocalDateStamp() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export default function Vouchers() {
  const { startDate, endDate, sector, region } = useOutletContext();
  return (
    <VouchersReport
      key={JSON.stringify([startDate, endDate, sector, region])}
      startDate={startDate}
      endDate={endDate}
      sector={sector}
      region={region}
    />
  );
}

function VouchersReport({ startDate, endDate, sector, region }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [startupId, setStartupId] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const exportInProgress = useRef(false);
  const loadVouchers = useCallback(
    () => getVouchers(buildVoucherParams(page, 20, {
      startDate, endDate, sector, region, status, startupId,
    })),
    [page, startDate, endDate, sector, region, status, startupId]
  );
  const { data, loading, error, reload } = useComplianceData(loadVouchers);
  const pagination = data?.pagination;

  const handleExport = async () => {
    if (exportInProgress.current) return;

    exportInProgress.current = true;
    setIsExporting(true);
    setExportError(null);
    let failedPage = 1;

    try {
      const filters = { startDate, endDate, sector, region, status, startupId };
      const firstPage = await getVouchers(buildVoucherParams(1, 100, filters));
      const totalPages = firstPage.pagination?.totalPages;

      if (!Number.isSafeInteger(totalPages) || totalPages < 1) {
        throw new Error("The vouchers response did not include a valid page count.");
      }

      const vouchers = [...firstPage.records];

      for (let exportPage = 2; exportPage <= totalPages; exportPage += 1) {
        failedPage = exportPage;
        const result = await getVouchers(buildVoucherParams(exportPage, 100, filters));
        vouchers.push(...result.records);
      }

      const csvRows = vouchers.map((voucher) => ({
        id: voucher.id,
        startup: voucher.startup?.businessName ?? "",
        amount: voucher.amount,
        status: voucher.status,
        sector: voucher.startup?.sector ?? "",
        region: voucher.startup?.region ?? "",
        expiresAt: voucher.expiresAt,
        createdAt: voucher.createdAt,
      }));

      downloadCsv(csvRows, `vouchers-${getLocalDateStamp()}.csv`, exportColumns);
    } catch (error) {
      setExportError(
        new Error(
          `Vouchers export failed on page ${failedPage}: ${
            error.response?.data?.message || error.message || "Please try again."
          }`
        )
      );
    } finally {
      exportInProgress.current = false;
      setIsExporting(false);
    }
  };

  return (
    <section>
      <PageHeading
        eyebrow="Voucher register"
        title="Vouchers"
        description="Paginated voucher records with their startup, value, and lifecycle details."
      />
      <fieldset className="eu-explorer-filters">
        <legend>Voucher filters</legend>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="COMMITTED_TO_ORDER">Committed to order</option>
            <option value="REDEEMED_AND_SETTLED">Redeemed and settled</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label>
          Startup ID
          <input
            value={startupId}
            onChange={(event) => {
              setStartupId(event.target.value);
              setPage(1);
            }}
          />
        </label>
      </fieldset>
      <div className="eu-pagination">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || !pagination?.total}
          aria-busy={isExporting}
        >
          {isExporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>
      <ReportState error={exportError} />
      <ReportState loading={loading} error={error} onRetry={reload} empty={Array.isArray(data?.records) && data.records.length === 0}>
        {Array.isArray(data?.records) && (
          <>
            <DataTable columns={columns} rows={data.records} rowKey={(row) => row.id} />
            <div className="eu-pagination">
              <span>
                Page {pagination?.page ?? page} of {pagination?.totalPages ?? 0}
                {pagination?.total !== undefined ? ` · ${pagination.total} vouchers` : ""}
              </span>
              <div>
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={loading || page <= 1}>
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={loading || !pagination || page >= pagination.totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </ReportState>
    </section>
  );
}
