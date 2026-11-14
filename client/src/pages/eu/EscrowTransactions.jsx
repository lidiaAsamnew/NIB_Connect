import { useCallback, useState } from "react";
import { getEscrowTransactions } from "../../services/complianceService.js";
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

export default function EscrowTransactions() {
  const [page, setPage] = useState(1);
  const loadTransactions = useCallback(
    () => getEscrowTransactions({ page, pageSize: 20 }),
    [page]
  );
  const { data, loading, error } = useComplianceData(loadTransactions);
  const pagination = data?.pagination;

  return (
    <section>
      <PageHeading
        eyebrow="Escrow ledger"
        title="Escrow transactions"
        description="Paginated escrow transaction records with order references, amounts, and status."
      />
      <ReportState loading={loading} error={error} empty={Array.isArray(data?.records) && data.records.length === 0}>
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
