import { useCallback, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getOrders } from "../../services/complianceService.js";
import { downloadCsv } from "../../utils/csvExport.js";
import { DataTable, PageHeading, ReportState } from "./ComplianceUI.jsx";
import { formatDate, formatMoney } from "./reportUtils.js";
import { useComplianceData } from "./useComplianceData.js";

const columns = [
  { key: "id", label: "Order ID" },
  { key: "waybillCode", label: "Waybill" },
  { key: "startup", label: "Startup", render: (startup) => startup?.businessName ?? "-" },
  { key: "sector", label: "Sector", render: (_, row) => row.startup?.sector ?? "-" },
  { key: "region", label: "Region", render: (_, row) => row.startup?.region ?? "-" },
  { key: "supplier", label: "Supplier", render: (supplier) => supplier?.companyName ?? "-" },
  { key: "status", label: "Status" },
  { key: "grossAmount", label: "Gross", render: formatMoney },
  { key: "discountApplied", label: "Savings", render: formatMoney },
  { key: "netAmountToPay", label: "Net to pay", render: formatMoney },
  { key: "createdAt", label: "Created", render: formatDate },
  {
    key: "details",
    label: "Details",
    render: (_, row) => (
      <button type="button" className="eu-table-action" onClick={() => row.onView(row)}>
        View details
      </button>
    ),
  },
];

const exportColumns = [
  { key: "id", label: "Order ID" },
  { key: "waybillCode", label: "Waybill" },
  { key: "startup", label: "Startup" },
  { key: "sector", label: "Sector" },
  { key: "region", label: "Region" },
  { key: "supplier", label: "Supplier" },
  { key: "status", label: "Status" },
  { key: "grossAmount", label: "Gross" },
  { key: "discountApplied", label: "Savings" },
  { key: "netAmountToPay", label: "Net to pay" },
  { key: "createdAt", label: "Created" },
];

function buildOrderParams(page, pageSize, filters) {
  const params = { page, pageSize };

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.sector?.trim()) params.sector = filters.sector.trim();
  if (filters.region?.trim()) params.region = filters.region.trim();
  if (filters.status) params.status = filters.status;
  if (filters.supplierId?.trim()) params.supplierId = filters.supplierId.trim();
  if (filters.search?.trim()) params.search = filters.search.trim();

  return params;
}

function getLocalDateStamp() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

export default function Orders() {
  const { startDate, endDate, sector, region } = useOutletContext();
  return (
    <OrdersReport
      key={JSON.stringify([startDate, endDate, sector, region])}
      startDate={startDate}
      endDate={endDate}
      sector={sector}
      region={region}
    />
  );
}

function OrdersReport({ startDate, endDate, sector, region }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const exportInProgress = useRef(false);
  const loadOrders = useCallback(
    () => getOrders(buildOrderParams(page, 20, {
      startDate, endDate, sector, region, status, supplierId, search,
    })),
    [page, startDate, endDate, sector, region, status, supplierId, search]
  );
  const { data, loading, error, reload } = useComplianceData(loadOrders);
  const pagination = data?.pagination;

  const handleExport = async () => {
    if (exportInProgress.current) return;

    exportInProgress.current = true;
    setIsExporting(true);
    setExportError(null);
    let failedPage = 1;

    try {
      const filters = { startDate, endDate, sector, region, status, supplierId, search };
      const firstPage = await getOrders(buildOrderParams(1, 100, filters));
      const totalPages = firstPage.pagination?.totalPages;

      if (!Number.isSafeInteger(totalPages) || totalPages < 1) {
        throw new Error("The orders response did not include a valid page count.");
      }

      const orders = [...firstPage.records];

      for (let exportPage = 2; exportPage <= totalPages; exportPage += 1) {
        failedPage = exportPage;
        const result = await getOrders(buildOrderParams(exportPage, 100, filters));
        orders.push(...result.records);
      }

      const csvRows = orders.map((order) => ({
        id: order.id,
        waybillCode: order.waybillCode ?? "",
        startup: order.startup?.businessName ?? "",
        sector: order.startup?.sector ?? "",
        region: order.startup?.region ?? "",
        supplier: order.supplier?.companyName ?? "",
        status: order.status,
        grossAmount: order.grossAmount,
        discountApplied: order.discountApplied,
        netAmountToPay: order.netAmountToPay,
        createdAt: order.createdAt,
      }));

      downloadCsv(csvRows, `orders-${getLocalDateStamp()}.csv`, exportColumns);
    } catch (error) {
      setExportError(
        new Error(
          `Orders export failed on page ${failedPage}: ${
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
        eyebrow="Order register"
        title="Orders"
        description="Paginated orders with their startup, supplier, and financial reporting fields."
      />
      <fieldset className="eu-explorer-filters">
        <legend>Order filters</legend>
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
            <option value="PLACED">Placed</option>
            <option value="DISPATCHED_IN_TRANSIT">Dispatched / in transit</option>
            <option value="DELIVERED_PENDING_HANDSHAKE">Delivered</option>
            <option value="VERIFIED_AND_CLEARED">Verified and cleared</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label>
          Supplier ID
          <input
            value={supplierId}
            onChange={(event) => {
              setSupplierId(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Order ID or waybill
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
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
            <DataTable
              columns={columns}
              rows={data.records.map((order) => ({ ...order, onView: setSelectedOrder }))}
              rowKey={(row) => row.id}
            />
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
      {selectedOrder && (
        <div className="eu-dialog-backdrop">
          <section
            className="eu-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
            tabIndex={-1}
            onKeyDown={(event) => {
              if (event.key === "Escape") setSelectedOrder(null);
            }}
          >
            <div className="eu-dialog-heading">
              <h2 id="order-details-title">Order details</h2>
              <button type="button" autoFocus onClick={() => setSelectedOrder(null)} aria-label="Close order details">
                Close
              </button>
            </div>
            <dl className="eu-order-details">
              <dt>Order ID</dt><dd>{selectedOrder.id}</dd>
              <dt>Waybill</dt><dd>{selectedOrder.waybillCode ?? "-"}</dd>
              <dt>Startup</dt><dd>{selectedOrder.startup?.businessName ?? "-"}</dd>
              <dt>Supplier</dt><dd>{selectedOrder.supplier?.companyName ?? "-"}</dd>
              <dt>Status</dt><dd>{selectedOrder.status}</dd>
              <dt>Gross</dt><dd>{formatMoney(selectedOrder.grossAmount)}</dd>
              <dt>Savings</dt><dd>{formatMoney(selectedOrder.discountApplied)}</dd>
              <dt>Net to pay</dt><dd>{formatMoney(selectedOrder.netAmountToPay)}</dd>
            </dl>
            <h3>Order items</h3>
            {selectedOrder.items?.length ? (
              <DataTable
                columns={[
                  { key: "product", label: "Product", render: (product) => product?.name ?? "-" },
                  { key: "quantity", label: "Quantity" },
                  { key: "unitPrice", label: "Unit price", render: formatMoney },
                  { key: "lineTotal", label: "Line total", render: formatMoney },
                ]}
                rows={selectedOrder.items}
                rowKey={(item) => item.id}
              />
            ) : <p>No item details are available for this order.</p>}
          </section>
        </div>
      )}
    </section>
  );
}