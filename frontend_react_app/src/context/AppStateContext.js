import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { nanoid } from "nanoid";
import { buildSeedState } from "../data/seed";
import { getTodayISO } from "../utils/date";
import { calculateDailyStreaks } from "../utils/streak";
import { getStateFromStorage, setStateToStorage, migrateState } from "../utils/storage";

/**
 * AppStateContext:
 * - Holds the full application state (habits, tasks, filters, ui)
 * - Reducer actions implement all requested mutations.
 * - Persistence: debounced localStorage write on state changes.
 */

const AppStateContext = createContext(null);

function pushToast(state, toast) {
  const next = {
    ...state,
    ui: {
      ...state.ui,
      toasts: [
        ...(state.ui?.toasts || []),
        { id: nanoid(), type: toast.type || "info", message: toast.message }
      ]
    }
  };
  return next;
}

function removeToast(state, id) {
  return {
    ...state,
    ui: { ...state.ui, toasts: (state.ui?.toasts || []).filter((t) => t.id !== id) }
  };
}

function recomputeHabitStreak(habit, todayISO) {
  const { currentStreak, bestStreak } = calculateDailyStreaks(habit.datesCompleted || [], todayISO);
  return { ...habit, streak: currentStreak, bestStreak };
}

function reducer(state, action) {
  const today = getTodayISO();

  switch (action.type) {
    case "ADD_HABIT": {
      const habit = {
        id: nanoid(),
        name: action.payload.name.trim(),
        description: action.payload.description || "",
        frequency: action.payload.frequency || "daily",
        datesCompleted: [],
        streak: 0,
        bestStreak: 0,
        color: action.payload.color || "#3b82f6"
      };
      return pushToast({ ...state, habits: [habit, ...state.habits] }, { type: "success", message: "Habit created" });
    }
    case "UPDATE_HABIT": {
      const updated = state.habits.map((h) =>
        h.id === action.payload.id ? { ...h, ...action.payload.patch } : h
      );
      return pushToast({ ...state, habits: updated }, { type: "success", message: "Habit updated" });
    }
    case "DELETE_HABIT": {
      return pushToast(
        { ...state, habits: state.habits.filter((h) => h.id !== action.payload.id) },
        { type: "error", message: "Habit deleted" }
      );
    }
    case "TOGGLE_HABIT_TODAY": {
      const updated = state.habits.map((h) => {
        if (h.id !== action.payload.id) return h;
        const dates = new Set(h.datesCompleted || []);
        if (dates.has(today)) dates.delete(today);
        else dates.add(today);
        const next = recomputeHabitStreak({ ...h, datesCompleted: Array.from(dates).sort() }, today);
        return next;
      });
      return pushToast({ ...state, habits: updated }, { type: "success", message: "Habit updated for today" });
    }

    case "ADD_TASK": {
      const task = {
        id: nanoid(),
        title: action.payload.title.trim(),
        description: action.payload.description || "",
        status: action.payload.status || "todo",
        priority: action.payload.priority || "med",
        dueDate: action.payload.dueDate || null,
        tags: action.payload.tags || [],
        completedAt: action.payload.status === "done" ? today : null
      };
      return pushToast({ ...state, tasks: [task, ...state.tasks] }, { type: "success", message: "Task created" });
    }
    case "UPDATE_TASK": {
      const updated = state.tasks.map((t) => {
        if (t.id !== action.payload.id) return t;
        const next = { ...t, ...action.payload.patch };
        // Maintain completedAt if moved to done.
        if (next.status === "done" && !next.completedAt) next.completedAt = today;
        if (next.status !== "done") next.completedAt = null;
        return next;
      });
      return pushToast({ ...state, tasks: updated }, { type: "success", message: "Task updated" });
    }
    case "DELETE_TASK": {
      return pushToast(
        { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload.id) },
        { type: "error", message: "Task deleted" }
      );
    }
    case "MOVE_TASK_STATUS": {
      const { id, status } = action.payload;
      const updated = state.tasks.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, status };
        if (status === "done" && !next.completedAt) next.completedAt = today;
        if (status !== "done") next.completedAt = null;
        return next;
      });
      return { ...state, tasks: updated };
    }

    case "SET_FILTERS": {
      return { ...state, filters: { ...state.filters, ...action.payload } };
    }

    case "IMPORT_STATE": {
      const migrated = migrateState(action.payload);
      if (!migrated) return pushToast(state, { type: "error", message: "Import failed: unsupported schema" });
      return pushToast({ ...migrated, ui: { ...migrated.ui, toasts: state.ui?.toasts || [] } }, { type: "success", message: "Imported state" });
    }
    case "EXPORT_STATE": {
      return state;
    }
    case "RESET_DEMO_DATA": {
      return pushToast(buildSeedState(), { type: "success", message: "Reset to demo data" });
    }
    case "DISMISS_TOAST": {
      return removeToast(state, action.payload.id);
    }
    default:
      return state;
  }
}

// PUBLIC_INTERFACE
export function AppStateProvider({ children }) {
  /** Provides app state and actions via React Context. */
  const initial = useMemo(() => getStateFromStorage() || buildSeedState(), []);
  const [state, dispatch] = useReducer(reducer, initial);

  // Debounced persistence
  const timerRef = useRef(null);
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setStateToStorage(state);
    }, 250);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [state]);

  const actions = useMemo(() => {
    return {
      addHabit: (payload) => dispatch({ type: "ADD_HABIT", payload }),
      updateHabit: (id, patch) => dispatch({ type: "UPDATE_HABIT", payload: { id, patch } }),
      deleteHabit: (id) => dispatch({ type: "DELETE_HABIT", payload: { id } }),
      toggleHabitToday: (id) => dispatch({ type: "TOGGLE_HABIT_TODAY", payload: { id } }),

      addTask: (payload) => dispatch({ type: "ADD_TASK", payload }),
      updateTask: (id, patch) => dispatch({ type: "UPDATE_TASK", payload: { id, patch } }),
      deleteTask: (id) => dispatch({ type: "DELETE_TASK", payload: { id } }),
      moveTaskStatus: (id, status) => dispatch({ type: "MOVE_TASK_STATUS", payload: { id, status } }),

      setFilters: (payload) => dispatch({ type: "SET_FILTERS", payload }),

      importState: (payload) => dispatch({ type: "IMPORT_STATE", payload }),
      resetDemoData: () => dispatch({ type: "RESET_DEMO_DATA" }),
      dismissToast: (id) => dispatch({ type: "DISMISS_TOAST", payload: { id } })
    };
  }, []);

  const value = useMemo(() => ({ state, dispatch, actions }), [state, actions]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAppState() {
  /** Access app state and action helpers. */
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

// PUBLIC_INTERFACE
export function useNavigate() {
  /** Lightweight internal router (no external dependency). */
  const { state, actions } = useAppState();
  return useCallback(
    (view) => {
      actions.setFilters({ view });
      window.history.pushState({}, "", `/${view === "dashboard" ? "dashboard" : view}`);
    },
    [actions]
  );
}

// PUBLIC_INTERFACE
export function useSyncRouteOnPopstate() {
  /** Keep internal view in sync with browser back/forward. */
  const { actions } = useAppState();

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname.replace("/", "");
      const view = ["dashboard", "habits", "tasks", "settings"].includes(path) ? path : "dashboard";
      actions.setFilters({ view });
    };
    window.addEventListener("popstate", onPop);
    onPop();
    return () => window.removeEventListener("popstate", onPop);
  }, [actions]);
}
