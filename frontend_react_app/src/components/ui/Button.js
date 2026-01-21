import React from "react";

const VARIANT = {
  primary: "bg-primary text-white hover:bg-blue-600",
  secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
  danger: "bg-error text-white hover:bg-red-600",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100"
};

// PUBLIC_INTERFACE
export function Button({ variant = "primary", size = "md", className = "", ...props }) {
  /** Reusable button component. */
  const sizes =
    size === "sm"
      ? "px-3 py-1.5 text-sm"
      : size === "lg"
        ? "px-4 py-2.5 text-base"
        : "px-4 py-2 text-sm";

  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        sizes,
        VARIANT[variant] || VARIANT.primary,
        className
      ].join(" ")}
      {...props}
    />
  );
}
