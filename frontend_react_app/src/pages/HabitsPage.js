import React, { useMemo, useState } from "react";
import { HabitList } from "../components/habits/HabitList";
import { HabitDetail } from "../components/habits/HabitDetail";
import { HabitModal } from "../components/habits/HabitModal";
import { useAppState } from "../context/AppStateContext";

// PUBLIC_INTERFACE
export function HabitsPage() {
  /** Habits page: list + detail + create/edit modal. */
  const { actions } = useAppState();
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { state } = useAppState();
  const selected = useMemo(() => (state.habits || []).find((h) => h.id === selectedId) || null, [state.habits, selectedId]);

  return (
    <div className="grid gap-4">
      {selected ? (
        <HabitDetail
          habit={selected}
          onBack={() => setSelectedId(null)}
          onEdit={(h) => {
            setEditing(h);
            setModalOpen(true);
          }}
        />
      ) : (
        <HabitList
          onSelect={(h) => setSelectedId(h.id)}
          onCreate={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          onEdit={(h) => {
            setEditing(h);
            setModalOpen(true);
          }}
        />
      )}

      <HabitModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={(payload) => {
          if (editing?.id) actions.updateHabit(editing.id, payload);
          else actions.addHabit(payload);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
