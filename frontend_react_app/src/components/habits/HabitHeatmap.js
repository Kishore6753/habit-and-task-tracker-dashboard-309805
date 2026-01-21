import React, { useEffect, useMemo, useState } from "react";
import { Heatmap } from "../Heatmap";
import { getTodayISO } from "../../utils/date";
import {
  ensureHabitCompletionSchema,
  isHabitCompletedOnDate,
  toggleHabitCompletedOnDate
} from "../../utils/storage";

// PUBLIC_INTERFACE
export function HabitHeatmap({ habitId, weeks = 12 }) {
  /** Habit-specific adherence heatmap backed by localStorage. */
  const [rev, setRev] = useState(0); // force refresh after toggles

  useEffect(() => {
    // Initialize/migrate completion schema (safe no-op if already exists)
    // We do not require appState here; we only ensure the key is well-formed.
    ensureHabitCompletionSchema();
  }, []);

  const getStatus = useMemo(() => {
    return (isoDate) => {
      // Include `rev` so this closure re-evaluates after toggles.
      void rev;
      return isHabitCompletedOnDate(habitId, isoDate);
    };
  }, [habitId, rev]);

  const onToggle = useMemo(() => {
    return (isoDate) => {
      toggleHabitCompletedOnDate(habitId, isoDate);
      setRev((x) => x + 1);
    };
  }, [habitId]);

  return (
    <Heatmap
      habitId={habitId}
      weeks={weeks}
      endDateISO={getTodayISO()}
      getStatus={getStatus}
      onToggle={onToggle}
      title="Adherence Heatmap"
      description="Tap a day to toggle completion. Stored locally (offline)."
    />
  );
}
