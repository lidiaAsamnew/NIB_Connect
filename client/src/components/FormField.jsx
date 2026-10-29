import { useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";

export default function FormField({
  id, label, icon: Icon, error, required = true, as = "input", type = "text", children, ...rest
}) {
  const [show, setShow] = useState(false);
  const Control = as;
  const isPassword = type === "password";
  const isSelect = as === "select";
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-forest">
        {label}
        {required && <span className="text-red-600" aria-hidden="true"> *</span>}
      </label>
      <div className="relative">
        {Icon && <Icon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />}
        <Control
          id={id}
          name={id}
          type={isSelect ? undefined : isPassword && show ? "text" : type}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-12 w-full rounded-lg border bg-white text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            Icon ? "pl-10" : "pl-3"
          } ${isPassword || isSelect ? "pr-10" : "pr-3"} ${isSelect ? "appearance-none" : ""} ${
            error ? "border-red-700" : "border-slate-300"
          }`}
          {...rest}
        >
          {children}
        </Control>
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-slate-600"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
        {isSelect && <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-600" />}
      </div>
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
