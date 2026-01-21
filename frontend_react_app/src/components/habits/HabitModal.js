import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

const COLORS = ["#3b82f6", "#06b6d4", "#64748b", "#EF4444"];

// PUBLIC_INTERFACE
export function HabitModal({ open, onClose, onSubmit, initial }) {
  /** Modal for creating/updating a habit. */
  const isEdit = Boolean(initial?.id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [color, setColor] = useState("#3b82f6");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setDescription(initial?.description || "");
    setFrequency(initial?.frequency || "daily");
    setColor(initial?.color || "#3b82f6");
  }, [open, initial]);

  const canSave = useMemo(() => name.trim().length > 0, [name]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Habit" : "New Habit"}
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSave}
            onClick={() => onSubmit({ name, description, frequency, color })}
          >
            Save
          </Button>
        </div>
      }
    >
      <div className="grid gap-3">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Meditate" />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
        <Select
          label="Frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "custom", label: "Custom" }
          ]}
        />
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Color</p>
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                className={[
                  "h-8 w-8 rounded-full border",
                  c === color ? "border-slate-900" : "border-slate-200"
                ].join(" ")}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
