import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ReportState } from "./ComplianceUI.jsx";
import { formatMoney } from "./reportUtils.js";

const orderStatuses = [
  { key: "PLACED", label: "Placed" },
  { key: "DISPATCHED_IN_TRANSIT", label: "Dispatched / in transit" },
  { key: "DELIVERED_PENDING_HANDSHAKE", label: "Delivered" },
  { key: "VERIFIED_AND_CLEARED", label: "Verified and cleared" },
  { key: "CANCELLED", label: "Cancelled" },
];

export function OrdersByStatusChart({ rows, loading, error, onRetry }) {
  const countsByStatus = new Map(
    (Array.isArray(rows) ? rows : []).map((row) => [row.status, row.orderCount])
  );
  const data = orderStatuses.map((status) => ({
    status: status.label,
    count: countsByStatus.get(status.key) ?? 0,
  }));

  return (
    <section className="eu-chart-section" aria-labelledby="orders-by-status-title">
      <div className="eu-chart-heading">
        <h2 id="orders-by-status-title">Orders by status</h2>
        <p>Order counts by current lifecycle status.</p>
      </div>
      <ReportState loading={loading} error={error} onRetry={onRetry} empty={!rows?.length}>
        <div
          className="eu-chart-card"
          role="img"
          aria-label={`Orders by status. ${data.map((row) => `${row.status}: ${row.count}`).join(". ")}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 18, bottom: 44, left: 8 }}>
              <CartesianGrid stroke="#e8eeeb" vertical={false} />
              <XAxis
                dataKey="status"
                interval={0}
                angle={-24}
                textAnchor="end"
                height={70}
                tick={{ fill: "#647772", fontSize: 10 }}
              />
              <YAxis allowDecimals={false} tick={{ fill: "#647772", fontSize: 12 }} />
              <Tooltip formatter={(value) => [value, "Orders"]} />
              <Legend />
              <Bar dataKey="count" name="Orders" fill="#53836a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ReportState>
    </section>
  );
}

export function SectorValueChart({ rows, loading, error, onRetry }) {
  const data = Array.isArray(rows)
    ? rows.map((row) => ({
        ...row,
        grossValue: Number(row.grossValue),
        clearedValue: Number(row.clearedValue),
      }))
    : [];

  return (
    <section className="eu-chart-section" aria-labelledby="sector-values-title">
      <div className="eu-chart-heading">
        <h2 id="sector-values-title">Gross vs cleared by sector</h2>
        <p>Reported monetary values in ETB.</p>
      </div>
      <ReportState loading={loading} error={error} onRetry={onRetry} empty={!data.length}>
        <div
          className="eu-chart-card"
          role="img"
          aria-label={`Gross and cleared value by sector in ETB. ${data
            .map((row) => `${row.sector}: gross ${formatMoney(row.grossValue)}, cleared ${formatMoney(row.clearedValue)}`)
            .join(". ")}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 18, bottom: 4, left: 8 }}>
              <CartesianGrid stroke="#e8eeeb" vertical={false} />
              <XAxis dataKey="sector" tick={{ fill: "#647772", fontSize: 12 }} />
              <YAxis
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en-ET", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(value)
                }
                tick={{ fill: "#647772", fontSize: 12 }}
                label={{ value: "ETB", angle: -90, position: "insideLeft", fill: "#647772" }}
              />
              <Tooltip formatter={(value, name) => [formatMoney(value), name]} />
              <Legend />
              <Bar dataKey="grossValue" name="Gross value" fill="#173a42" />
              <Bar dataKey="clearedValue" name="Cleared value" fill="#a67624" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ReportState>
    </section>
  );
}

export function RegionValueChart({ rows }) {
  const data = Array.isArray(rows)
    ? rows.map((row) => ({
        ...row,
        grossValue: Number(row.grossValue),
        clearedValue: Number(row.clearedValue),
      }))
    : [];

  if (!data.length) return null;

  return (
    <section className="eu-chart-section" aria-labelledby="region-values-title">
      <div className="eu-chart-heading">
        <h2 id="region-values-title">Gross vs cleared by region</h2>
        <p>Reported monetary values in ETB.</p>
      </div>
      <div
        className="eu-chart-card"
        role="img"
        aria-label={`Gross and cleared value by region in ETB. ${data
          .map((row) => `${row.region}: gross ${formatMoney(row.grossValue)}, cleared ${formatMoney(row.clearedValue)}`)
          .join(". ")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 18, bottom: 4, left: 8 }}>
            <CartesianGrid stroke="#e8eeeb" vertical={false} />
            <XAxis dataKey="region" tick={{ fill: "#647772", fontSize: 12 }} />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat("en-ET", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(value)
              }
              tick={{ fill: "#647772", fontSize: 12 }}
              label={{ value: "ETB", angle: -90, position: "insideLeft", fill: "#647772" }}
            />
            <Tooltip formatter={(value, name) => [formatMoney(value), name]} />
            <Legend />
            <Bar dataKey="grossValue" name="Gross value" fill="#173a42" />
            <Bar dataKey="clearedValue" name="Cleared value" fill="#a67624" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
