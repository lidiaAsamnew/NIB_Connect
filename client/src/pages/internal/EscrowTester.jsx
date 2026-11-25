import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

// Sends a request and always returns { ok, status, message, data } instead of throwing
async function call(config) {
  try {
    const res = await api.request(config);
    return {
      ok: true,
      status: res.status,
      message: res.data?.message || "OK",
      data: res.data?.data ?? res.data,
    };
  } catch (err) {
    if (!err.response) {
      return {
        ok: false,
        status: null,
        message: "Could not reach the server. Is the backend running on port 5000?",
        data: null,
      };
    }
    return {
      ok: false,
      status: err.response.status,
      message: err.response.data?.message || err.message,
      data: null,
    };
  }
}

const asUser = (userId) => ({ "x-user-id": userId });

function ResultBox({ result }) {
  if (!result) return null;
  const style = result.ok
    ? "border-green-600 bg-green-50 text-green-900"
    : "border-red-600 bg-red-50 text-red-900";
  return (
    <div className={`mt-3 rounded border p-3 text-sm ${style}`}>
      <div className="font-semibold">
        {result.ok ? "Success" : "Error"} {result.status ? `(HTTP ${result.status})` : ""}
      </div>
      <div>{result.message}</div>
      {result.data && (
        <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(result.data, null, 2)}</pre>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="mb-6 rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const inputClass = "w-full rounded border border-gray-300 px-2 py-1";
const buttonClass =
  "rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-50";

export default function EscrowTester() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [operatorId, setOperatorId] = useState("");
  const [ownerId, setOwnerId] = useState("");

  // Allocate voucher form
  const [startupId, setStartupId] = useState("");
  const [amount, setAmount] = useState("50000.00");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");
  const [allocateResult, setAllocateResult] = useState(null);

  // Order form
  const [myVouchers, setMyVouchers] = useState([]);
  const [voucherId, setVoucherId] = useState("");
  const [quantities, setQuantities] = useState({});
  const [orderResult, setOrderResult] = useState(null);

  // After-order tracking
  const [trackedVoucher, setTrackedVoucher] = useState(null);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackedOrderId, setTrackedOrderId] = useState("");

  const operators = users.filter((u) => u.role === "NIB_SYSTEM_OPERATOR");
  const owners = users.filter((u) => u.role === "WOMEN_STARTUP_OWNER");

  // Load users and products once
  useEffect(() => {
    call({ method: "get", url: "/dev/tester-data" }).then((r) => {
      if (!r.ok) {
        setLoadError(r.message);
        return;
      }
      const list = r.data.users;
      setUsers(list);
      setProducts(r.data.products);
      const op = list.find((u) => u.role === "NIB_SYSTEM_OPERATOR");
      const owner = list.find((u) => u.role === "WOMEN_STARTUP_OWNER");
      if (op) setOperatorId(op.id);
      if (owner) {
        setOwnerId(owner.id);
        if (owner.startupProfile) setStartupId(owner.startupProfile.id);
      }
    });
  }, []);

  const refreshVouchers = useCallback(async () => {
    if (!ownerId) return;
    const r = await call({
      method: "get",
      url: "/vouchers/me?limit=50",
      headers: asUser(ownerId),
    });
    if (r.ok) {
      setMyVouchers(r.data);
      setVoucherId((current) => current || r.data.find((v) => v.status === "ALLOCATED")?.id || "");
    }
  }, [ownerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshVouchers();
  }, [refreshVouchers]);

  // Re-reads the voucher and order from the server (their status after an action)
  async function refreshTracking(vId, oId) {
    if (vId) {
      const v = await call({ method: "get", url: `/vouchers/${vId}`, headers: asUser(ownerId) });
      setTrackedVoucher(v);
    }
    if (oId) {
      const o = await call({ method: "get", url: `/orders/${oId}`, headers: asUser(ownerId) });
      setTrackedOrder(o);
    }
  }

  async function handleAllocate(e) {
    e.preventDefault();
    const body = { startupId, amount };
    if (expiryDate) body.expiresAt = new Date(`${expiryDate}T23:59:59.000Z`).toISOString();
    const r = await call({
      method: "post",
      url: "/vouchers/allocate",
      headers: asUser(operatorId),
      data: body,
    });
    setAllocateResult(r);
    if (r.ok) {
      setVoucherId(r.data.id);
      await refreshVouchers();
    }
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    const items = products
      .filter((p) => Number(quantities[p.id]) !== 0 && quantities[p.id] !== undefined && quantities[p.id] !== "")
      .map((p) => ({ productId: p.id, quantity: Number(quantities[p.id]) }));

    if (items.length === 0) {
      setOrderResult({ ok: false, status: null, message: "Enter a quantity for at least one product.", data: null });
      return;
    }

    const r = await call({
      method: "post",
      url: "/orders",
      headers: asUser(ownerId),
      data: { voucherId, items },
    });
    setOrderResult(r);
    setTrackedOrderId(r.ok ? r.data.id : "");
    setTrackedOrder(null);

    // Always re-read the voucher: after a failure it must still be ALLOCATED (rollback proof)
    await refreshTracking(voucherId, r.ok ? r.data.id : "");
    await refreshVouchers();
    const stock = await call({ method: "get", url: "/dev/tester-data" });
    if (stock.ok) setProducts(stock.data.products);
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold">Escrow Tester</h1>
        <ResultBox result={{ ok: false, message: loadError, status: null, data: null }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Escrow Tester</h1>
      <p className="mb-6 text-sm text-gray-600">
        Developer tool for the voucher and order engine. It uses the temporary dev login, not the
        real one.
      </p>

      <Card title="1. Who is acting?">
        <label className="mb-1 block text-sm font-medium">NIB operator</label>
        <select className={`${inputClass} mb-3`} value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
          {operators.map((u) => (
            <option key={u.id} value={u.id}>{u.fullName}</option>
          ))}
        </select>
        <label className="mb-1 block text-sm font-medium">Startup owner</label>
        <select
          className={inputClass}
          value={ownerId}
          onChange={(e) => {
            const id = e.target.value;
            setOwnerId(id);
            setVoucherId("");
            setStartupId(owners.find((u) => u.id === id)?.startupProfile?.id || "");
          }}
        >
          {owners.map((u) => (
            <option key={u.id} value={u.id}>{u.fullName}</option>
          ))}
        </select>
      </Card>

      <Card title="2. Allocate a voucher (operator)">
        <form onSubmit={handleAllocate} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Startup</label>
            <select className={inputClass} value={startupId} onChange={(e) => setStartupId(e.target.value)}>
              {owners
                .filter((u) => u.startupProfile)
                .map((u) => (
                  <option key={u.startupProfile.id} value={u.startupProfile.id}>
                    {u.startupProfile.businessName}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Amount (ETB)</label>
            <input className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Expiry date (optional)</label>
            <input type="date" className={inputClass} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
          <button className={buttonClass} type="submit">Allocate voucher</button>
        </form>
        <ResultBox result={allocateResult} />
      </Card>

      <Card title="3. Place an order (startup owner)">
        <form onSubmit={handlePlaceOrder} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Voucher</label>
            <select className={inputClass} value={voucherId} onChange={(e) => setVoucherId(e.target.value)}>
              <option value="">Select a voucher</option>
              {myVouchers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.amount} ETB | {v.status} | {v.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium">Products (quantity)</div>
            {products.map((p) => (
              <div key={p.id} className="mb-2 flex items-center gap-3">
                <div className="flex-1 text-sm">
                  {p.name} <span className="text-gray-500">| {p.price} ETB | stock {p.stockQuantity}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                  value={quantities[p.id] ?? ""}
                  onChange={(e) => setQuantities({ ...quantities, [p.id]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <button className={buttonClass} type="submit" disabled={!voucherId}>Place order</button>
        </form>
        <ResultBox result={orderResult} />
      </Card>

      <Card title="4. Status after the order">
        <div className="mb-3 flex gap-3">
          <button
            type="button"
            className={buttonClass}
            onClick={() => refreshTracking(voucherId, trackedOrderId)}
            disabled={!voucherId}
          >
            Refresh voucher and order status
          </button>
        </div>
        <h3 className="font-medium">Voucher</h3>
        {trackedVoucher ? (
          <ResultBox result={{ ...trackedVoucher, message: `Status: ${trackedVoucher.data?.status ?? "?"}` }} />
        ) : (
          <p className="text-sm text-gray-500">Place an order to see this.</p>
        )}
        <h3 className="mt-4 font-medium">Order</h3>
        {trackedOrder ? (
          <ResultBox result={{ ...trackedOrder, message: `Status: ${trackedOrder.data?.status ?? "?"}` }} />
        ) : (
          <p className="text-sm text-gray-500">No order yet (a failed order creates none).</p>
        )}
      </Card>
    </div>
  );
}