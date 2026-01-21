import React, { useMemo } from "react";
import { Card } from "./ui/Card";
import { Select } from "./ui/Select";
import { useAppState } from "../context/AppStateContext";
import { getTodayISO } from "../utils/date";

const DATE_PRESETS = [
  { value: "last30", label: "Last 30 days" },
  { value: "today", label: "Today" }
];

// PUBLIC_INTERFACE
export function FilterBar({ mode }) {
  /** Global filters for tasks and dashboard date range. */
  const { state, actions } = useAppState();

  const tagOptions = useMemo(() => {
    const tags = new Set();
    for (const t of state.tasks || []) (t.tags || []).forEach((x) => tags.add(x));
    return [{ value: "all", label: "All tags" }, ...Array.from(tags).sort().map((t) => ({ value: t, label: `#${t}` }))];
  }, [state.tasks]);

  if (mode === "dashboard") {
    const preset = state.filters?.dateRange?.preset || "last30";
    return (
      <Card title="Dashboard Filters">
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            label="Date range"
            value={preset}
            onChange={(e) => {
              const v = e.target.value;
              const endISO = getTodayISO();
              actions.setFilters({
                dateRange: { preset: v, startISO: null, endISO }
              });
            }}
            options={DATE_PRESETS}
          />
          <div className="text-sm text-slate-600 md:col-span-2">
            Charts update using this time window (currently used as “end date”; start is derived from preset).
          </div>
        </div>
      </Card>
    );
  }

  if (mode === "tasks") {
    const taskFilter = state.filters?.task || { status: "all", priority: "all", dueWindow: "all", tag: "all" };
    return (
      <Card title="Task Filters">
        <div className="grid gap-3 md:grid-cols-4">
          <Select
            label="Status"
            value={taskFilter.status || "all"}
            onChange={(e) => actions.setFilters({ task: { ...taskFilter, status: e.target.value } })}
            options={[
              { value: "all", label: "All" },
              { value: "todo", label: "Todo" },
              { value: "in-progress", label: "In-Progress" },
              { value: "done", label: "Done" }
            ]}
          />
          <Select
            label="Priority"
            value={taskFilter.priority || "all"}
            onChange={(e) => actions.setFilters({ task: { ...taskFilter, priority: e.target.value } })}
            options={[
              { value: "all", label: "All" },
              { value: "low", label: "Low" },
              { value: "med", label: "Med" },
              { value: "high", label: "High" }
            ]}
          />
          <Select
            label="Due window"
            value={taskFilter.dueWindow || "all"}
            onChange={(e) => actions.setFilters({ task: { ...taskFilter, dueWindow: e.target.value } })}
            options={[
              { value: "all", label: "All" },
              { value: "overdue", label: "Overdue" },
              { value: "next7", label: "Next 7 days" },
              { value: "nodue", label: "No due date" }
            ]}
          />
          <Select
            label="Tag"
            value={taskFilter.tag || "all"}
            onChange={(e) => actions.setFilters({ task: { ...taskFilter, tag: e.target.value } })}
            options={tagOptions}
          />
        </div>
      </Card>
    );
  }

  return null;
}
