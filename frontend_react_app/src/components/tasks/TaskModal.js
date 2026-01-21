import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

// PUBLIC_INTERFACE
export function TaskModal({ open, onClose, onSubmit, initial }) {
  /** Modal for creating/updating a task. */
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("med");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title || "");
    setDescription(initial?.description || "");
    setStatus(initial?.status || "todo");
    setPriority(initial?.priority || "med");
    setDueDate(initial?.dueDate || "");
    setTags((initial?.tags || []).join(", "));
  }, [open, initial]);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  const payload = useMemo(() => {
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      title,
      description,
      status,
      priority,
      dueDate: dueDate || null,
      tags: parsedTags
    };
  }, [title, description, status, priority, dueDate, tags]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Task" : "New Task"}
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canSave} onClick={() => onSubmit(payload)}>
            Save
          </Button>
        </div>
      }
    >
      <div className="grid gap-3">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Buy groceries" />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />

        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "todo", label: "Todo" },
              { value: "in-progress", label: "In-Progress" },
              { value: "done", label: "Done" }
            ]}
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: "low", label: "Low" },
              { value: "med", label: "Med" },
              { value: "high", label: "High" }
            ]}
          />
        </div>

        <Input label="Due date (YYYY-MM-DD)" value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="2026-01-30" />

        <Input label="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="work, health" />
      </div>
    </Modal>
  );
}
