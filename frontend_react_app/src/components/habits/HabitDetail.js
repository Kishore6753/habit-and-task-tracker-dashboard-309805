import React, { useMemo } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { getLastNDaysRange, getTodayISO } from "../../utils/date";
import { useAppState } from "../../context/AppStateContext";
import { HabitHeatmap } from "./HabitHeatmap";

// PUBLIC_INTERFACE
export function HabitDetail({ habit, onBack, onEdit }) {
  /** Detail view for a habit with a simple 30-day completion grid. */
  const { actions } = useAppState();
  const today = getTodayISO();

  const days = useMemo(() => getLastNDaysRange(30, today), [today]);
  const completed = new Set(habit.datesCompleted || []);

  return (
    <Card
      title={habit.name}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onBack}>
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(habit)}>
            Edit
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="primary">Current {habit.streak || 0}</Badge>
        <Badge tone="secondary">Best {habit.bestStreak || 0}</Badge>
        <Badge tone="success">{habit.frequency}</Badge>
      </div>

      {habit.description ? <p className="mt-3 text-sm text-slate-600">{habit.description}</p> : null}

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Last 30 days</p>
          <Button
            size="sm"
            variant={(habit.datesCompleted || []).includes(today) ? "secondary" : "primary"}
            onClick={() => actions.toggleHabitToday(habit.id)}
          >
            Toggle Today
          </Button>
        </div>

        <div className="grid grid-cols-10 gap-2">
          {days.map((d) => {
            const isDone = completed.has(d);
            return (
              <div
                key={d}
                className={[
                  "h-8 rounded-lg border text-[10px] flex items-center justify-center select-none",
                  isDone ? "border-transparent" : "border-slate-200",
                  isDone ? "" : "bg-white"
                ].join(" ")}
                style={{
                  backgroundColor: isDone ? (habit.color || "#3b82f6") : undefined,
                  color: isDone ? "white" : "#64748b"
                }}
                title={d}
                aria-label={`${d}: ${isDone ? "completed" : "not completed"}`}
                role="img"
              >
                {d.slice(8)}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <HabitHeatmap habitId={habit.id} weeks={12} />
        </div>
      </div>
    </Card>
  );
}
