import React from "react";

// PUBLIC_INTERFACE
export function Card({ title, actions, children, className = "" }) {
  /** Simple card/panel container. */
  return (
    <section className={["rounded-2xl border border-slate-200 bg-white shadow-sm", className].join(" ")}>
      {title ? (
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
