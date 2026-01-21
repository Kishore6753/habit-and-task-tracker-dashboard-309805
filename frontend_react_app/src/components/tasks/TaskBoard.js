import React, { useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useAppState } from "../../context/AppStateContext";

const COLUMNS = [
  { key: "todo", label: "Todo" },
  { key: "in-progress", label: "In-Progress" },
  { key: "done", label: "Done" }
];

function priorityTone(priority) {
  if (priority === "high") return "danger";
  if (priority === "med") return "primary";
  return "secondary";
}

function filterTasks(tasks, filters, search) {
  const s = (search || "").toLowerCase();

  return tasks.filter((t) => {
    if (s) {
      const text = `${t.title} ${t.description || ""} ${(t.tags || []).join(" ")}`.toLowerCase();
      if (!text.includes(s)) return false;
    }

    const f = filters?.task || {};
    if (f.status && f.status !== "all" && t.status !== f.status) return false;
    if (f.priority && f.priority !== "all" && t.priority !== f.priority) return false;
    if (f.tag && f.tag !== "all" && !(t.tags || []).includes(f.tag)) return false;

    // dueWindow: all | overdue | next7 | nodue
    if (f.dueWindow && f.dueWindow !== "all") {
      const today = new Date();
      const due = t.dueDate ? new Date(t.dueDate) : null;
      if (f.dueWindow === "nodue") return !due;
      if (!due) return false;

      const diff = Math.floor((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      if (f.dueWindow === "overdue") return diff < 0;
      if (f.dueWindow === "next7") return diff >= 0 && diff <= 7;
    }

    return true;
  });
}

// PUBLIC_INTERFACE
export function TaskBoard({ onEdit, onCreate }) {
  /** Kanban board with drag-and-drop between columns. */
  const { state, actions } = useAppState();
  const search = state.filters?.search || "";

  const filtered = useMemo(
    () => filterTasks(state.tasks || [], state.filters, search),
    [state.tasks, state.filters, search]
  );

  const byStatus = useMemo(() => {
    const buckets = { todo: [], "in-progress": [], done: [] };
    for (const t of filtered) buckets[t.status].push(t);
    return buckets;
  }, [filtered]);

  return (
    <Card
      title="Task Board"
      actions={
        <Button variant="primary" size="sm" onClick={onCreate} aria-label="Create task">
          New
        </Button>
      }
    >
      <DragDropContext
        onDragEnd={(result) => {
          if (!result.destination) return;
          const { draggableId, destination } = result;
          const newStatus = destination.droppableId;
          actions.moveTaskStatus(draggableId, newStatus);
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.key} className="min-w-0">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{col.label}</h3>
                <Badge tone="secondary">{byStatus[col.key].length}</Badge>
              </div>

              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={[
                      "min-h-[240px] rounded-2xl border border-slate-200 p-2 transition",
                      snapshot.isDraggingOver ? "bg-blue-50" : "bg-slate-50"
                    ].join(" ")}
                    aria-label={`${col.label} column`}
                  >
                    {byStatus[col.key].map((t, idx) => (
                      <Draggable key={t.id} draggableId={t.id} index={idx}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={[
                              "mb-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm",
                              dragSnapshot.isDragging ? "ring-2 ring-primary/30" : ""
                            ].join(" ")}
                            role="article"
                            aria-label={`Task: ${t.title}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{t.title}</p>
                                {t.description ? (
                                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{t.description}</p>
                                ) : null}
                              </div>
                              <button
                                className="text-sm text-slate-500 hover:text-slate-700"
                                onClick={() => onEdit(t)}
                                aria-label={`Edit task ${t.title}`}
                              >
                                Edit
                              </button>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>
                              {t.dueDate ? <Badge tone="secondary">Due {t.dueDate}</Badge> : null}
                              {(t.tags || []).slice(0, 2).map((tag) => (
                                <Badge key={tag} tone="secondary">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="mt-3 flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => actions.deleteTask(t.id)}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </Card>
  );
}
