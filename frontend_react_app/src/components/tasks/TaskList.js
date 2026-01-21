import React, { useMemo } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useAppState } from "../../context/AppStateContext";

function tone(status) {
  if (status === "done") return "success";
  if (status === "in-progress") return "primary";
  return "secondary";
}

// PUBLIC_INTERFACE
export function TaskList({ onEdit }) {
  /** Compact list of tasks (filtered by global search). */
  const { state, actions } = useAppState();
  const search = (state.filters?.search || "").toLowerCase();

  const tasks = useMemo(() => {
    const all = state.tasks || [];
    return all.filter((t) => {
      if (!search) return true;
      const text = `${t.title} ${t.description || ""} ${(t.tags || []).join(" ")}`.toLowerCase();
      return text.includes(search);
    });
  }, [state.tasks, search]);

  return (
    <Card title="All Tasks (compact)">
      <div className="grid gap-2">
        {tasks.length === 0 ? <p className="text-sm text-slate-600">No tasks.</p> : null}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{t.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone={tone(t.status)}>{t.status}</Badge>
                <Badge tone="secondary">{t.priority}</Badge>
                {t.dueDate ? <Badge tone="secondary">Due {t.dueDate}</Badge> : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(t)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => actions.deleteTask(t.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
