import React, { useMemo, useState } from "react";
import { useAppState, useNavigate } from "../context/AppStateContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

const NAV = [
  { key: "dashboard", label: "Dashboard" },
  { key: "habits", label: "Habits" },
  { key: "tasks", label: "Tasks" },
  { key: "settings", label: "Settings" }
];

// PUBLIC_INTERFACE
export function Layout({ children }) {
  /** App shell with sidebar/drawer navigation and header. */
  const { state, actions } = useAppState();
  const navigate = useNavigate();
  const view = state.filters?.view || "dashboard";

  const [drawerOpen, setDrawerOpen] = useState(false);

  const headerTitle = useMemo(() => {
    const item = NAV.find((n) => n.key === view);
    return item ? item.label : "Dashboard";
  }, [view]);

  return (
    <div className="min-h-screen bg-appbg text-text">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
          <div className="px-5 py-5">
            <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-gray-50 px-4 py-3">
              <h1 className="text-base font-bold text-slate-900">Habit & Task Tracker</h1>
              <p className="mt-1 text-xs text-slate-600">Offline • localStorage</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-3 pb-5">
            {NAV.map((n) => (
              <button
                key={n.key}
                className={[
                  "w-full rounded-xl px-4 py-2 text-left text-sm font-medium transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  view === n.key ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                ].join(" ")}
                onClick={() => navigate(n.key)}
                aria-current={view === n.key ? "page" : undefined}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto px-5 pb-5 text-xs text-slate-500">
            Tip: Use the search box to filter habits and tasks.
          </div>
        </aside>

        {/* Mobile drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-40 bg-slate-900/30 md:hidden" onMouseDown={() => setDrawerOpen(false)}>
            <div className="h-full w-72 bg-white p-4" onMouseDown={(e) => e.stopPropagation()}>
              <div className="mb-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-gray-50 px-4 py-3">
                <h1 className="text-base font-bold text-slate-900">Habit & Task Tracker</h1>
                <p className="mt-1 text-xs text-slate-600">Offline • localStorage</p>
              </div>
              <div className="flex flex-col gap-1">
                {NAV.map((n) => (
                  <button
                    key={n.key}
                    className={[
                      "w-full rounded-xl px-4 py-2 text-left text-sm font-medium transition",
                      view === n.key ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                    ].join(" ")}
                    onClick={() => {
                      navigate(n.key);
                      setDrawerOpen(false);
                    }}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open navigation menu"
                >
                  Menu
                </Button>
                <h2 className="text-lg font-semibold text-slate-900">{headerTitle}</h2>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
                <div className="w-full sm:w-64">
                  <Input
                    label="Search"
                    value={state.filters?.search || ""}
                    onChange={(e) => actions.setFilters({ search: e.target.value })}
                    placeholder="Search habits and tasks…"
                    aria-label="Search habits and tasks"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => navigate("habits")}>
                    Add Habit
                  </Button>
                  <Button variant="primary" onClick={() => navigate("tasks")}>
                    Add Task
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 md:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
