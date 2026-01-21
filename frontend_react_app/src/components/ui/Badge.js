import React from "react";

const TONE = {
  primary: "bg-blue-50 text-blue-700 border-blue-100",
  success: "bg-cyan-50 text-cyan-700 border-cyan-100",
  secondary: "bg-slate-50 text-slate-700 border-slate-200",
  danger: "bg-red-50 text-red-700 border-red-100"
};

// PUBLIC_INTERFACE
export function Badge({ tone = "secondary", className = "", children }) {
  /** Small badge/tag component. */
  return (
    <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", TONE[tone], className].join(" ")}>
      {children}
    </span>
  );
}
