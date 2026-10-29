import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, FileText, LayoutDashboard, LogOut, Menu, Package, Search, Ticket, User } from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import useBackendStatus, { HEALTH_TEXT } from "../hooks/useBackendStatus";

const LINKS = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Profile", "/startup/profile", User],
  ["Vouchers", "/vouchers", Ticket],
  ["Products", "/products", Package],
  ["My Orders", "/orders", FileText],
  ["Notifications", "/notifications", Bell],
];
const DOT = { loading: "bg-amber-300", ok: "bg-green-400", error: "bg-red-400" };
const UNREAD_SAMPLE = 2; // sample value until the notifications API exists

export default function BeneficiaryLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state } = useBackendStatus();
  const name = user?.fullName ?? "";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  const itemClass = "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium";
  const linkClass = ({ isActive }) =>
    `${itemClass} ${isActive ? "bg-white/15 font-semibold" : "hover:bg-white/10"}`;

  return (
    <div className="flex min-h-screen text-slate-900">
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside
        id="side-nav"
        className={`${open ? "flex" : "hidden"} fixed inset-y-0 left-0 z-30 w-64 flex-col bg-gradient-to-b from-forest to-forest-deep p-4 text-white lg:static lg:flex lg:flex-none`}
      >
        <Logo light subtitle={false} />
        <nav aria-label="Main" className="mt-6 flex-1 space-y-1">
          {LINKS.map(([label, to, Icon]) => (
            <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
              <Icon aria-hidden="true" className="size-5" />
              {label}
              {label === "Notifications" && (
                <span className="ml-auto rounded-full bg-red-600 px-2 text-xs font-semibold">{UNREAD_SAMPLE}</span>
              )}
            </NavLink>
          ))}
          <button type="button" onClick={handleLogout} className={`${itemClass} hover:bg-white/10`}>
            <LogOut aria-hidden="true" className="size-5" />
            Logout
          </button>
        </nav>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
            <span className="grid size-10 flex-none place-items-center rounded-full bg-mint-deep font-bold text-forest">
              {name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{name}</div>
              <div className="text-xs text-white/80">Women Startup Owner</div>
            </div>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <span aria-hidden="true" className={`size-2 rounded-full ${DOT[state]}`} />
              {HEALTH_TEXT[state]}
            </div>
            <div className="mt-1 truncate text-white/80">API: {import.meta.env.VITE_API_BASE_URL ?? "not set"}</div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col bg-mint/40">
        <header className="flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-lg border border-slate-300 lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="side-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <Menu className="size-5" />
          </button>
          <div className="relative max-w-md flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input type="search" aria-label="Search" placeholder="Search..." className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand" />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Bell aria-label="Notifications" className="size-5 text-slate-700" />
            <div className="flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-full bg-mint-deep font-bold text-forest">{name.charAt(0).toUpperCase()}</span>
              <div className="hidden text-sm leading-tight sm:block">
                <div className="font-semibold">{name}</div>
                <div className="text-xs text-slate-600">Women Startup Owner</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
