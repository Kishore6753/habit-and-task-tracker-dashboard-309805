import React from "react";
import { useAppState } from "../../context/AppStateContext";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { getTodayISO } from "../../utils/date";

// PUBLIC_INTERFACE
export function HabitList({ onSelect, onCreate, onEdit }) {
  /** List view for habits with quick toggle for today. */
  const { state, actions } = useAppState();
  const today = getTodayISO();
  const habits = state.habits || [];
  const search = (state.filters?.search || "").toLowerCase();

  const filtered = habits.filter((h) => {
    if (!search) return true;
    return (
      h.name.toLowerCase().includes(search) ||
      (h.description || "").toLowerCase().includes(search)
    );
  });

  return (
    <Card
      title="Your Habits"
      actions={
        <Button variant="primary" size="sm" onClick={onCreate} aria-label="Create habit">
          New
        </Button>
      }
    >
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-600">No habits match your search.</p>
        ) : null}

        {filtered.map((h) => {
          const doneToday = (h.datesCompleted || []).includes(today);
          return (
            <div
              key={h.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
            >
              <button
                className="text-left focus:outline-none"
                onClick={() => onSelect(h)}
                aria-label={`Open habit details for ${h.name}`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: h.color || "#3b82f6" }} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{h.name}</h3>
                      <Badge tone="primary">Streak {h.streak || 0}</Badge>
                      <Badge tone="secondary">Best {h.bestStreak || 0}</Badge>
                    </div>
                    {h.description ? (
                      <p className="mt-1 text-sm text-slate-600">{h.description}</p>
                    ) : null}
                  </div>
                </div>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={doneToday ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => actions.toggleHabitToday(h.id)}
                  aria-pressed={doneToday}
                  aria-label={doneToday ? `Unmark ${h.name} for today` : `Mark ${h.name} complete today`}
                >
                  {doneToday ? "Done Today" : "Complete Today"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(h)} aria-label={`Edit habit ${h.name}`}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => actions.deleteHabit(h.id)}
                  aria-label={`Delete habit ${h.name}`}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
