import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "./reportUtils.js";

const series = [
  {
    dataKey: "grossVoucherValueETB",
    name: "Gross voucher value",
    color: "#173a42",
  },
  {
    dataKey: "socioEconomicSavingsETB",
    name: "Socio-economic savings",
    color: "#53836a",
  },
  {
    dataKey: "clearedETB",
    name: "Cleared value",
    color: "#a67624",
  },
];

function aggregateWeeklyAllocation(rows) {
  const weeks = new Map();

  for (const row of rows) {
    let week = weeks.get(row.euReportingWeek);

    if (!week) {
      week = {
        euReportingWeek: row.euReportingWeek,
        grossVoucherValueETB: 0,
        socioEconomicSavingsETB: 0,
        clearedETB: 0,
      };
      weeks.set(row.euReportingWeek, week);
    }

    week.grossVoucherValueETB += Math.round(Number(row.grossVoucherValueETB) * 100);
    week.socioEconomicSavingsETB += Math.round(Number(row.socioEconomicSavingsETB) * 100);
    week.clearedETB += Math.round(Number(row.clearedETB) * 100);
  }

  return Array.from(weeks.values(), (week) => ({
    ...week,
    grossVoucherValueETB: week.grossVoucherValueETB / 100,
    socioEconomicSavingsETB: week.socioEconomicSavingsETB / 100,
    clearedETB: week.clearedETB / 100,
  }));
}

function formatReportingWeek(value) {
  return value.replace(/^(\d{4})-(\d{2})$/u, "$1 W$2");
}

export default function WeeklyAllocationChart({ rows }) {
  const chartData = aggregateWeeklyAllocation(rows);

  return (
    <div
      className="eu-chart-card"
      role="img"
      aria-label={`Weekly gross voucher value, socio-economic savings, and cleared value in ETB. ${chartData
        .map((week) => `${formatReportingWeek(week.euReportingWeek)}: gross ${formatMoney(week.grossVoucherValueETB)}, savings ${formatMoney(week.socioEconomicSavingsETB)}, cleared ${formatMoney(week.clearedETB)}`)
        .join(". ")}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 12, right: 18, bottom: 4, left: 8 }}>
          <CartesianGrid stroke="#e8eeeb" vertical={false} />
          <XAxis
            dataKey="euReportingWeek"
            tickFormatter={formatReportingWeek}
            tick={{ fill: "#647772", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#cbd9d2" }}
            minTickGap={24}
          />
          <YAxis
            width={72}
            tickFormatter={(value) =>
              new Intl.NumberFormat("en-ET", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(value)
            }
            tick={{ fill: "#647772", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "ETB",
              angle: -90,
              position: "insideLeft",
              fill: "#647772",
            }}
          />
          <Tooltip
            labelFormatter={(value) => `Reporting week ${formatReportingWeek(value)}`}
            formatter={(value, name) => [formatMoney(value), name]}
            contentStyle={{
              border: "1px solid #dfe8e4",
              borderRadius: 4,
              color: "#183840",
            }}
          />
          <Legend verticalAlign="bottom" height={36} />
          {series.map((item) => (
            <Line
              key={item.dataKey}
              type="monotone"
              dataKey={item.dataKey}
              name={item.name}
              stroke={item.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
