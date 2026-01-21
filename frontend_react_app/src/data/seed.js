import { nanoid } from "nanoid";
import { getLastNDaysRange, getTodayISO } from "../utils/date";
import { calculateDailyStreaks } from "../utils/streak";

function makeHabit({ name, description, color, completedDaysAgo = [] }) {
  const id = nanoid();
  const today = getTodayISO();
  const last30 = getLastNDaysRange(30, today);
  const datesCompleted = last30
    .filter((_, idx) => {
      const daysAgo = 29 - idx;
      return completedDaysAgo.includes(daysAgo);
    })
    .map((d) => d);

  const { currentStreak, bestStreak } = calculateDailyStreaks(datesCompleted, today);
  return {
    id,
    name,
    description,
    frequency: "daily",
    datesCompleted,
    streak: currentStreak,
    bestStreak,
    color
  };
}

function makeTask({ title, description, status, priority, dueDate, tags, completedAt }) {
  return {
    id: nanoid(),
    title,
    description,
    status,
    priority,
    dueDate,
    tags,
    completedAt: completedAt || null
  };
}

// PUBLIC_INTERFACE
export function buildSeedState() {
  /** Initial demo data for first run. */
  const today = getTodayISO();
  const habits = [
    makeHabit({
      name: "Drink Water",
      description: "8 glasses per day",
      color: "#06b6d4",
      completedDaysAgo: [0, 1, 2, 3, 5, 6, 7, 9, 10]
    }),
    makeHabit({
      name: "Read 20 Minutes",
      description: "Fiction or non-fiction",
      color: "#3b82f6",
      completedDaysAgo: [0, 1, 3, 4, 8, 9]
    }),
    makeHabit({
      name: "Stretch",
      description: "Mobility + posture reset",
      color: "#64748b",
      completedDaysAgo: [1, 2, 3, 4, 5]
    })
  ];

  const tasks = [
    makeTask({
      title: "Plan weekly goals",
      description: "Pick top 3 outcomes for the week",
      status: "todo",
      priority: "med",
      dueDate: today,
      tags: ["planning"]
    }),
    makeTask({
      title: "Finish analytics page",
      description: "Charts: completion + throughput",
      status: "in-progress",
      priority: "high",
      dueDate: today,
      tags: ["work", "frontend"]
    }),
    makeTask({
      title: "Email check-in",
      description: "Send status update",
      status: "done",
      priority: "low",
      dueDate: today,
      tags: ["admin"],
      completedAt: today
    })
  ];

  return {
    habits,
    tasks,
    filters: {
      view: "dashboard",
      search: "",
      dateRange: { preset: "last30", startISO: null, endISO: today },
      task: { status: "all", priority: "all", dueWindow: "all", tag: "all" }
    },
    ui: {
      toasts: []
    }
  };
}
