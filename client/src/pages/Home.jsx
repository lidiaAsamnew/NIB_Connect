import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, ShieldCheck, Ticket, Users, X } from "lucide-react";
import { heroWoman } from "../assets";
import HealthStatus from "../components/HealthStatus";
import Logo from "../components/Logo";

const FEATURES = [
  { Icon: Ticket, title: "Digital Vouchers", text: "Get allocated vouchers to grow your business" },
  { Icon: Users, title: "Trusted Suppliers", text: "Access verified suppliers and quality products" },
  { Icon: ShieldCheck, title: "Secure & Transparent", text: "Track orders and transactions in real-time" },
];
const NAV = [
  ["About", "#features"],
  ["How It Works", "#features"],
  ["Contact", "#contact"],
];

export default function Home() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-mint to-mint-deep/60 text-forest">
      <header className="relative z-20 mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" aria-label="NIB-Connect home"><Logo /></Link>
          <nav aria-label="Main" className="hidden gap-8 text-sm md:flex">
            <Link to="/" className="font-bold">Home</Link>
            {NAV.map(([label, href]) => (
              <a key={label} href={href} className="font-medium">{label}</a>
            ))}
          </nav>
          <div className="hidden gap-3 md:flex">
            <Link to="/login" className="inline-flex min-h-11 items-center rounded-lg border border-forest px-5 text-sm font-semibold">Login</Link>
            <Link to="/register" className="inline-flex min-h-11 items-center rounded-lg bg-forest px-5 text-sm font-semibold text-white">Register</Link>
          </div>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            className="grid size-11 place-items-center rounded-lg md:hidden"
          >
            {open ? <X aria-hidden="true" className="size-6" /> : <Menu aria-hidden="true" className="size-6" />}
          </button>
        </div>
        {open && (
          <nav id="mobile-menu" aria-label="Mobile" className="mt-2 space-y-1 rounded-xl bg-white p-3 shadow-lg md:hidden">
            <Link to="/" onClick={close} className="block rounded-lg px-3 py-3 font-bold">Home</Link>
            {NAV.map(([label, href]) => (
              <a key={label} href={href} onClick={close} className="block rounded-lg px-3 py-3 font-medium">{label}</a>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-forest text-sm font-semibold">Login</Link>
              <Link to="/register" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-forest text-sm font-semibold text-white">Register</Link>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="grid items-center gap-6 py-4 md:grid-cols-2 md:py-6">
          <div className="space-y-5">
            <span className="inline-block rounded-full bg-mint-deep px-4 py-1.5 text-sm font-medium">Support Women. Grow Businesses.</span>
            <h1 className="text-[2.75rem] font-bold leading-[1.05] md:text-5xl md:leading-tight">NIB-Connect Beneficiary Gateway</h1>
            <p className="max-w-md text-lg text-slate-700">
              Empowering women startup owners through digital vouchers, trusted suppliers and secure payments.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-forest px-8 font-semibold text-white md:rounded-full">Get Started</Link>
              <a href="#features" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-forest px-8 font-semibold md:rounded-full">Learn More</a>
            </div>
          </div>
          <div className="relative">
            <img src={heroWoman} alt="A smiling woman startup owner holding a tablet" className="mx-auto w-full max-w-sm md:ml-auto md:max-w-md" />
            <p aria-hidden="true" className="absolute right-0 top-2 -rotate-6 font-script text-2xl leading-6 md:text-3xl md:leading-7">
              More<br />Women<br />Stronger<br />Businesses
            </p>
          </div>
        </section>
        <section id="features" className="grid gap-3 md:grid-cols-3 md:gap-4 md:rounded-2xl md:bg-white/70 md:p-5 md:shadow-sm">
          {FEATURES.map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4 rounded-xl bg-white/80 p-4 shadow-sm md:bg-transparent md:p-0 md:shadow-none">
              <span className="grid size-14 flex-none place-items-center rounded-full bg-forest text-white">
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <div>
                <h2 className="font-bold">{title}</h2>
                <p className="text-sm text-slate-700">{text}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <div id="contact" className="mt-10">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true" className="block h-14 w-full fill-forest">
          <path d="M0 40C240 0 480 0 720 30S1200 70 1440 30V80H0Z" />
        </svg>
        <footer className="flex flex-col items-center justify-between gap-3 bg-forest px-6 pb-5 text-sm text-white sm:flex-row">
          <span>NIB-Connect &nbsp;|&nbsp; Beneficiary Gateway</span>
          <HealthStatus />
        </footer>
      </div>
    </div>
  );
}
