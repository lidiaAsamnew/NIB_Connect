import { useCallback, useState } from "react";
import { getOrders } from "../../services/complianceService.js";
import { DataTable, PageHeading, ReportState } from "./ComplianceUI.jsx";
import { formatDate, formatMoney } from "./reportUtils.js";
import { useComplianceData } from "./useComplianceData.js";

const columns = [
  { key: "id", label: "Order ID" },
  { key: "startup", label: "Startup", render: (startup) => startup?.businessName ?? "-" },
  { key: "sector", label: "Sector", render: (_, row) => row.startup?.sector ?? "-" },
  { key: "region", label: "Region", render: (_, row) => row.startup?.region ?? "-" },
  { key: "supplier", label: "Supplier", render: (supplier) => supplier?.companyName ?? "-" },
  { key: "status", label: "Status" },
  { key: "grossAmount", label: "Gross", render: formatMoney },
  { key: "discountApplied", label: "Savings", render: formatMoney },
  { key: "netAmountToPay", label: "Net to pay", render: formatMoney },
  { key: "createdAt", label: "Created", render: formatDate },
];

export default function Orders() {
  const [page, setPage] = useState(1);
  const loadOrders = useCallback(() => getOrders({ page, pageSize: 20 }), [page]);
  const { data, loading, error } = useComplianceData(loadOrders);
  const pagination = data?.pagination;

  return (
    <section>
      <PageHeading
        eyebrow="Order register"
        title="Orders"
        description="Paginated orders with their startup, supplier, and financial reporting fields."
      />
      <ReportState loading={loading} error={error} empty={Array.isArray(data?.records) && data.records.length === 0}>
        {Array.isArray(data?.records) && (
          <>
            <DataTable columns={columns} rows={data.records} rowKey={(row) => row.id} />
            <div className="eu-pagination">
              <span>
                Page {pagination?.page ?? page} of {pagination?.totalPages ?? 0}
                {pagination?.total !== undefined ? ` · ${pagination.total} orders` : ""}
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