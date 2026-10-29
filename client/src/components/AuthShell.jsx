import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Logo from "./Logo";

export default function AuthShell({ tone, heading, text, quote, image, children }) {
  const dark = tone === "dark";
  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[2fr_3fr]">
      {/* Phone only: white top bar with a back button and the logo */}
      <header className="flex items-center bg-white px-2 py-3 lg:hidden">
        <Link to="/" aria-label="Back to home" className="grid size-11 flex-none place-items-center text-forest">
          <ChevronLeft aria-hidden="true" className="size-6" />
        </Link>
        <div className="mx-auto pr-11"><Logo /></div>
      </header>

      <aside
        className={`relative flex flex-col gap-5 overflow-hidden px-6 py-6 lg:p-8 lg:pb-20 ${
          dark ? "bg-gradient-to-b from-forest to-forest-deep pb-16 text-white" : "bg-mint pb-2 text-forest"
        }`}
      >
        <div className="hidden lg:block"><Logo light={dark} /></div>
        <div className={dark ? "" : "hidden lg:block"}>
          <p className="text-3xl font-bold">{heading}</p>
          <p className={`mt-3 max-w-xs ${dark ? "text-white" : "text-slate-700"}`}>{text}</p>
        </div>
        <img src={image} alt="" className="mx-auto w-full max-w-xs" />
        <p className={`mt-auto hidden lg:block ${dark ? "italic" : "font-semibold"}`}>{quote}</p>
        <svg viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true" className={`absolute bottom-0 left-0 hidden h-14 w-full lg:block ${dark ? "fill-forest-deep" : "fill-forest"}`}>
          <path d="M0 30C80 0 160 0 240 25S340 50 400 20V60H0z" />
        </svg>
      </aside>

      <main className="relative z-10 flex-1 px-4 pb-6 lg:flex lg:items-center lg:justify-center lg:bg-slate-50 lg:p-8">
        <div className={`mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:mt-0 ${dark ? "-mt-10" : "mt-4"}`}>
          {!dark && (
            <div className="mb-5 lg:hidden">
              <h1 className="text-2xl font-bold text-forest">{heading}</h1>
              <p className="mt-1 text-slate-700">{text}</p>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Phone only: green wave at the bottom */}
      <svg viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true" className="block h-14 w-full fill-forest lg:hidden">
        <path d="M0 30C80 0 160 0 240 25S340 50 400 20V60H0z" />
      </svg>
    </div>
  );
}
