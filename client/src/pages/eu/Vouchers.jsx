import { useCallback, useState } from "react";
import { getVouchers } from "../../services/complianceService.js";
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

export default function Vouchers() {
  const [page, setPage] = useState(1);
  const loadVouchers = useCallback(() => getVouchers({ page, pageSize: 20 }), [page]);
  const { data, loading, error } = useComplianceData(loadVouchers);
  const pagination = data?.pagination;

  return (
    <section>
      <PageHeading
        eyebrow="Voucher register"
        title="Vouchers"
        description="Paginated voucher records with their startup, value, and lifecycle details."
      />
      <ReportState loading={loading} error={error} empty={Array.isArray(data?.records) && data.records.length === 0}>
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
