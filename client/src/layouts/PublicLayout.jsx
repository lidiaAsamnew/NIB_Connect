import { Link, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="bg-brand text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold">NIB-Connect</Link>
          <nav aria-label="Account" className="flex gap-4 text-sm font-semibold">
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="px-4 py-4 text-center text-xs text-slate-600">
        NIB-Connect Beneficiary Gateway
      </footer>
    </div>
  );
}
