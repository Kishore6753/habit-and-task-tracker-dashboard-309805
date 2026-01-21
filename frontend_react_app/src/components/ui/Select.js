import React from "react";

// PUBLIC_INTERFACE
export function Select({ label, options, className = "", ...props }) {
  /** Reusable select component. */
  return (
    <label className="block w-full">
      {label ? (
        <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      ) : null}
      <select
        className={[
          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
          className
        ].join(" ")}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
