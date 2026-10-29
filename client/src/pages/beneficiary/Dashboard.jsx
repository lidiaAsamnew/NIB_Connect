import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Receipt, ShoppingCart, Sprout, Ticket } from "lucide-react";
import { dashboardWoman } from "../../assets";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";

// Sample data: it is replaced by real API data in Weeks 2 to 5.
const STATS = [
  { label: "Allocated Vouchers", value: 4, to: "/vouchers", link: "View details", Icon: Ticket, tone: "bg-brand" },
  { label: "My Orders", value: 2, to: "/orders", link: "View orders", Icon: ShoppingCart, tone: "bg-blue-600" },
  { label: "Cleared Transactions", value: 1, to: "/orders", link: "View receipts", Icon: Receipt, tone: "bg-indigo-600" },
];
const ORDERS = [
  { id: "ORD-001", supplier: "Agro-Processing", status: "PLACED", date: "Oct 20, 2026" },
  { id: "ORD-002", supplier: "Fresh Farm Ltd.", status: "DISPATCHED_IN_TRANSIT", date: "Oct 18, 2026" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  return hour < 18 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-forest">
          {greeting()}, {firstName}! <span aria-hidden="true">👋</span>
        </h1>
        <p className="text-slate-700">Here&rsquo;s what&rsquo;s happening with your business today.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map(({ label, value, to, link, Icon, tone }) => (
          <div key={label} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <span className={`grid size-11 flex-none place-items-center rounded-full text-white ${tone}`}>
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div>
              <div className="text-sm font-medium text-slate-700">{label}</div>
              <div className="text-3xl font-bold text-forest">{value}</div>
              <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                {link} <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      <section className="flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-mint to-mint-deep p-5">
        <div className="max-w-md">
          <h2 className="flex items-center gap-2 text-lg font-bold text-forest">
            <Sprout aria-hidden="true" className="size-5" /> Grow Your Business
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Use your allocated vouchers to buy from approved suppliers and track your orders in real-time.
          </p>
          <Link to="/products" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-forest px-5 text-sm font-semibold text-white">
            Browse Products
          </Link>
        </div>
        <img src={dashboardWoman} alt="" className="hidden h-36 mix-blend-multiply sm:block" />
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-forest">Recent Orders</h2>
          <Link to="/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            View all <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">Order #</th>
                <th className="px-3 py-2 font-semibold">Supplier</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-bold text-forest">{o.id}</td>
                  <td className="px-3 py-3">{o.supplier}</td>
                  <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-3 py-3">{o.date}</td>
                  <td className="px-3 py-3">
                    <Link to="/orders" aria-label={`Open order ${o.id}`}><ChevronRight className="size-4" /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
