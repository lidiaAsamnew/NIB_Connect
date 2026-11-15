import { useEffect, useState } from "react";
import { operationsService } from "../../services/operationsService";

const initialFilters = { status: "", supplierId: "", startupId: "", waybillCode: "", from: "", to: "" };

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

function formatLabel(value) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function OrderDetailModal({ order, tab, setTab, onClose }) {
  return (
    <div className="ops-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="ops-modal ops-order-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
        <header className="ops-modal-heading">
          <div>
            <p className="eyebrow">Order monitoring</p>
            <h2 id="order-detail-title">Order details</h2>
          </div>
          <button className="ops-close" type="button" onClick={onClose} aria-label="Close order details">×</button>
        </header>
        <div className="ops-modal-tabs" role="tablist" aria-label="Order detail views">
          {["details", "timeline", "escrow"].map((item) => (
            <button
              key={item}
              className={tab === item ? "is-selected" : ""}
              type="button"
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
            >
              {item === "details" ? "Details" : item === "timeline" ? "Timeline" : "Escrow transactions"}
            </button>
          ))}
        </div>
        {!order ? (
          <p className="ops-state" role="status">Loading order details…</p>
        ) : tab === "details" ? (
          <>
            <dl className="ops-detail-grid">
              <div><dt>Order ID</dt><dd className="ops-id-cell">{order.id}</dd></div>
              <div><dt>Status</dt><dd>{formatLabel(order.status)}</dd></div>
              <div><dt>Startup</dt><dd>{order.startupBusinessName || "—"}</dd></div>
              <div><dt>Supplier</dt><dd>{order.supplierCompanyName || "—"}</dd></div>
              <div><dt>Gross amount</dt><dd>{formatMoney(order.grossAmount)}</dd></div>
              <div><dt>Discount applied</dt><dd>{formatMoney(order.discountApplied)}</dd></div>
              <div><dt>Net amount</dt><dd>{formatMoney(order.netAmountToPay)}</dd></div>
              <div><dt>Waybill</dt><dd>{order.waybillCode || "—"}</dd></div>
            </dl>
            <h3 className="ops-modal-section-title">Items</h3>
            <div className="ops-table-wrap">
              <table className="ops-table ops-compact-table">
                <thead><tr><th>Product</th><th>Quantity</th><th>Unit price</th><th>Line total</th></tr></thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product?.name || "—"}</td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.unitPrice)}</td>
                      <td>{formatMoney(item.lineTotal)}</td>
                    </tr>
                  ))}
                  {order.items.length === 0 && <tr><td className="ops-empty-cell" colSpan="4">No item details recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        ) : tab === "timeline" ? (
          <ol className="ops-timeline">
            {[
              ["Order placed", order.createdAt],
              ["Dispatched", order.dispatchedAt],
              ["Arrived", order.arrivedAt],
              ["Cleared", order.clearedAt],
            ].map(([label, date]) => (
              <li key={label} className={date ? "has-event" : ""}>
                <span className="ops-timeline-marker" />
                <div><strong>{label}</strong><time>{formatDate(date)}</time></div>
              </li>
            ))}
            {order.handshakes.map((attempt) => (
              <li key={attempt.id} className={attempt.success ? "has-event" : "is-warning-event"}>
                <span className="ops-timeline-marker" />
                <div>
                  <strong>{attempt.success ? "Handshake accepted" : "Handshake failed"}</strong>
                  <time>{formatDate(attempt.attemptedAt)}</time>
                  {attempt.message && <p>{attempt.message}</p>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table ops-compact-table">
              <thead><tr><th>Date</th><th>Direction</th><th>Amount</th><th>Status</th><th>Description</th></tr></thead>
              <tbody>
                {order.escrowTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.createdAt)}</td>
                    <td>{transaction.direction}</td>
                    <td>{formatMoney(transaction.amount)}</td>
                    <td>{transaction.status}</td>
                    <td>{transaction.description}</td>
                  </tr>
                ))}
                {order.escrowTransactions.length === 0 && <tr><td className="ops-empty-cell" colSpan="5">No escrow transactions recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function OperatorOrdersPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailTab, setDetailTab] = useState("details");

  useEffect(() => {
    let active = true;
    operationsService.listOrders({ ...appliedFilters, page, limit: 10 })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Order records could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appliedFilters, page]);

  useEffect(() => {
    if (!selectedOrderId) return undefined;
    let active = true;
    operationsService.getOrder(selectedOrderId)
      .then((data) => {
        if (active) setOrderDetails(data);
      })
      .catch((requestError) => {
        if (active) setDetailError(requestError.response?.data?.message || "Order details could not be loaded.");
      })
      .finally(() => {
        if (active) setIsDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedOrderId]);

  function applyFilters(event) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setIsLoading(true);
    setError("");
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  }

  function openOrder(orderId, tab) {
    setIsDetailLoading(true);
    setDetailError("");
    setOrderDetails(null);
    setDetailTab(tab);
    setSelectedOrderId(orderId);
  }

  return (
    <section className="ops-page">
      <header className="ops-page-heading">
        <div>
          <p className="eyebrow">Operational visibility</p>
          <h1>Order monitoring</h1>
          <p className="ops-subtitle">Inspect order status, delivery timeline, and escrow transactions. Financial records are read-only.</p>
        </div>
        <span className="ops-count"><strong>{result.total}</strong> orders</span>
      </header>

      <form className="ops-filter-panel ops-filter-grid" onSubmit={applyFilters}>
        <label>
          Status
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">All statuses</option>
            <option value="PLACED">Placed</option>
            <option value="DISPATCHED_IN_TRANSIT">Dispatched</option>
            <option value="DELIVERED_PENDING_HANDSHAKE">Pending handshake</option>
            <option value="VERIFIED_AND_CLEARED">Cleared</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label>
          Supplier ID
          <input value={filters.supplierId} onChange={(event) => setFilters({ ...filters, supplierId: event.target.value })} />
        </label>
        <label>
          Startup ID
          <input value={filters.startupId} onChange={(event) => setFilters({ ...filters, startupId: event.target.value })} />
        </label>
        <label>
          Waybill code
          <input value={filters.waybillCode} onChange={(event) => setFilters({ ...filters, waybillCode: event.target.value })} />
        </label>
        <label>
          Created from
          <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
        </label>
        <label>
          Created to
          <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
        </label>
        <div className="ops-filter-actions">
          <button className="primary-button ops-action" type="submit">Apply filters</button>
          <button className="quiet-button" type="button" onClick={clearFilters}>Clear</button>
        </div>
      </form>

      {error && <p className="ops-error" role="alert">{error}</p>}

      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Startup</th>
              <th scope="col">Supplier</th>
              <th scope="col">Net amount</th>
              <th scope="col">Status</th>
              <th scope="col">Waybill</th>
              <th scope="col">Created</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="ops-empty-cell" colSpan="8">Loading orders…</td></tr>
            ) : result.items.length === 0 ? (
              <tr><td className="ops-empty-cell" colSpan="8">No orders match these filters.</td></tr>
            ) : result.items.map((order) => (
              <tr key={order.id}>
                <td className="ops-id-cell">{order.id}</td>
                <td>{order.startupBusinessName || "—"}</td>
                <td>{order.supplierCompanyName || "—"}</td>
                <td>{formatMoney(order.netAmountToPay)}</td>
                <td><span className="ops-badge is-neutral">{formatLabel(order.status)}</span></td>
                <td>{order.waybillCode || "—"}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>
                  <div className="ops-row-actions">
                    <button className="ops-text-button" type="button" onClick={() => openOrder(order.id, "details")}>Details</button>
                    <button className="ops-text-button" type="button" onClick={() => openOrder(order.id, "timeline")}>Timeline</button>
                    <button className="ops-text-button" type="button" onClick={() => openOrder(order.id, "escrow")}>Escrow</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="ops-pagination">
        <span>Page {page} of {Math.max(result.totalPages, 1)}</span>
        <div>
          <button className="quiet-button" type="button" disabled={isLoading || page <= 1} onClick={() => {
            setIsLoading(true);
            setError("");
            setPage((value) => value - 1);
          }}>
            Previous
          </button>
          <button className="quiet-button" type="button" disabled={isLoading || page >= result.totalPages} onClick={() => {
            setIsLoading(true);
            setError("");
            setPage((value) => value + 1);
          }}>
            Next
          </button>
        </div>
      </footer>

      {selectedOrderId && (
        detailError ? (
          <div className="ops-modal-backdrop">
            <section className="ops-modal" role="alert">
              <p className="ops-error">{detailError}</p>
              <button className="quiet-button" type="button" onClick={() => setSelectedOrderId("")}>Close</button>
            </section>
          </div>
        ) : isDetailLoading ? (
          <div className="ops-modal-backdrop">
            <section className="ops-modal"><p className="ops-state" role="status">Loading order details…</p></section>
          </div>
        ) : orderDetails ? (
            <OrderDetailModal
              order={orderDetails}
              tab={detailTab}
              setTab={setDetailTab}
              onClose={() => setSelectedOrderId("")}
            />
        ) : null
      )}
    </section>
  );
}
