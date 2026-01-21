import React from "react";

// PUBLIC_INTERFACE
export function Input({ label, id, className = "", ...props }) {
  /** Reusable input component. */
  return (
    <label className="block w-full">
      {label ? (
        <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      ) : null}
      <input
        id={id}
        className={[
          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900",
          "placeholder:text-slate-400 shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
          className
        ].join(" ")}
        {...props}
      />
    </label>
  );
}
