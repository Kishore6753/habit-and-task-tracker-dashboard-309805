import React, { useEffect } from "react";
import { useAppState } from "../context/AppStateContext";

function tone(type) {
  if (type === "success") return "border-cyan-100 bg-cyan-50 text-cyan-900";
  if (type === "error") return "border-red-100 bg-red-50 text-red-900";
  return "border-slate-200 bg-white text-slate-900";
}

// PUBLIC_INTERFACE
export function ToastStack() {
  /** Renders transient toast notifications from global state. */
  const { state, actions } = useAppState();
  const toasts = state.ui?.toasts || [];

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      window.setTimeout(() => actions.dismissToast(t.id), 2500)
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [toasts, actions]);

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={["rounded-xl border px-4 py-3 shadow-sm", tone(t.type)].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium">{t.message}</p>
            <button
              className="text-sm text-slate-500 hover:text-slate-700"
              onClick={() => actions.dismissToast(t.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
