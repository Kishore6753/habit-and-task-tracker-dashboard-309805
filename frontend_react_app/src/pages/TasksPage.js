import React, { useState } from "react";
import { FilterBar } from "../components/FilterBar";
import { TaskBoard } from "../components/tasks/TaskBoard";
import { TaskList } from "../components/tasks/TaskList";
import { TaskModal } from "../components/tasks/TaskModal";
import { useAppState } from "../context/AppStateContext";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

// PUBLIC_INTERFACE
export function TasksPage() {
  /** Tasks page: filters + kanban + quick add + edit modal. */
  const { actions } = useAppState();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [quickTitle, setQuickTitle] = useState("");

  return (
    <div className="grid gap-4">
      <FilterBar mode="tasks" />

      <Card title="Quick add">
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="flex-1">
            <Input
              label="Task title"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="e.g. Walk 10 minutes"
              onKeyDown={(e) => {
                if (e.key === "Enter" && quickTitle.trim()) {
                  actions.addTask({ title: quickTitle.trim() });
                  setQuickTitle("");
                }
              }}
              aria-label="Quick add task title"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => {
              if (!quickTitle.trim()) return;
              actions.addTask({ title: quickTitle.trim() });
              setQuickTitle("");
            }}
          >
            Add
          </Button>
        </div>
      </Card>

      <TaskBoard
        onCreate={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        onEdit={(t) => {
          setEditing(t);
          setModalOpen(true);
        }}
      />

      <TaskList
        onEdit={(t) => {
          setEditing(t);
          setModalOpen(true);
        }}
      />

      <TaskModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={(payload) => {
          if (editing?.id) actions.updateTask(editing.id, payload);
          else actions.addTask(payload);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
