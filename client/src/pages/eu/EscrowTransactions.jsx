import { useCallback, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getEscrowTransactions } from "../../services/complianceService.js";
import { downloadCsv } from "../../utils/csvExport.js";
import { DataTable, PageHeading, ReportState } from "./ComplianceUI.jsx";
import { formatDate, formatMoney } from "./reportUtils.js";
import { useComplianceData } from "./useComplianceData.js";

const columns = [
  { key: "reference", label: "Transaction reference" },
  { key: "orderId", label: "Order" },
  { key: "amount", label: "Amount", render: formatMoney },
  { key: "direction", label: "Direction" },
  { key: "status", label: "Status" },
  { key: "description", label: "Description" },
  { key: "createdAt", label: "Created", render: formatDate },
];

const exportColumns = [
  { key: "reference", label: "Transaction reference" },
  { key: "orderId", label: "Order" },
  { key: "amount", label: "Amount" },
  { key: "direction", label: "Direction" },
  { key: "status", label: "Status" },
  { key: "description", label: "Description" },
  { key: "createdAt", label: "Created" },
];

function buildTransactionParams(page, pageSize, filters) {
  const params = { page, pageSize };

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.sector?.trim()) params.sector = filters.sector.trim();
  if (filters.region?.trim()) params.region = filters.region.trim();
  if (filters.direction) params.direction = filters.direction;
  if (filters.orderId?.trim()) params.orderId = filters.orderId.trim();

  return params;
}

function getLocalDateStamp() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export default function EscrowTransactions() {
  const { startDate, endDate, sector, region } = useOutletContext();
  return (
    <EscrowTransactionsReport
      key={JSON.stringify([startDate, endDate, sector, region])}
      startDate={startDate}
      endDate={endDate}
      sector={sector}
      region={region}
    />
  );
}

function EscrowTransactionsReport({ startDate, endDate, sector, region }) {
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const exportInProgress = useRef(false);
  const loadTransactions = useCallback(
    () => getEscrowTransactions(buildTransactionParams(page, 20, {
      startDate, endDate, sector, region, direction, orderId,
    })),
    [page, startDate, endDate, sector, region, direction, orderId]
  );
  const { data, loading, error, reload } = useComplianceData(loadTransactions);
  const pagination = data?.pagination;

  const handleExport = async () => {
    if (exportInProgress.current) return;

    exportInProgress.current = true;
    setIsExporting(true);
    setExportError(null);
    let failedPage = 1;

    try {
      const filters = { startDate, endDate, sector, region, direction, orderId };
      const firstPage = await getEscrowTransactions(buildTransactionParams(1, 100, filters));
      const totalPages = firstPage.pagination?.totalPages;

      if (!Number.isSafeInteger(totalPages) || totalPages < 1) {
        throw new Error("The escrow response did not include a valid page count.");
      }

      const transactions = [...firstPage.records];

      for (let exportPage = 2; exportPage <= totalPages; exportPage += 1) {
        failedPage = exportPage;
        const result = await getEscrowTransactions(
          buildTransactionParams(exportPage, 100, filters)
        );
        transactions.push(...result.records);
      }

      downloadCsv(
        transactions,
        `escrow-transactions-${getLocalDateStamp()}.csv`,
        exportColumns
      );
    } catch (error) {
      setExportError(
        new Error(
          `Escrow transactions export failed on page ${failedPage}: ${
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
        eyebrow="Escrow ledger"
        title="Escrow transactions"
        description="Paginated escrow transaction records with order references, amounts, and status."
      />
      <fieldset className="eu-explorer-filters">
        <legend>Escrow filters</legend>
        <label>
          Direction
          <select
            value={direction}
            onChange={(event) => {
              setDirection(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All directions</option>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
          </select>
        </label>
        <label>
          Order ID
          <input
            value={orderId}
            onChange={(event) => {
              setOrderId(event.target.value);
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
                {pagination?.total !== undefined ? ` · ${pagination.total} transactions` : ""}
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
