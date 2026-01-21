import { getLastNDaysRange, groupISOByWeek, startOfWeekISO } from "./date";

/**
 * Chart builders return { data, options } objects compatible with react-chartjs-2.
 */

// PUBLIC_INTERFACE
export function buildHabitCompletionLast30Days(habits, { endISO }) {
  /** Habit completion count by day for last 30 days. */
  const days = getLastNDaysRange(30, endISO);
  const counts = days.map((d) => {
    let c = 0;
    for (const h of habits) {
      if ((h.datesCompleted || []).includes(d)) c += 1;
    }
    return c;
  });

  return {
    data: {
      labels: days.map((d) => d.slice(5)),
      datasets: [
        {
          label: "Completions",
          data: counts,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.25)",
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  };
}

// PUBLIC_INTERFACE
export function buildStreakLeaders(habits) {
  /** Top 5 by best streak. */
  const top = habits
    .slice()
    .sort((a, b) => (b.bestStreak || 0) - (a.bestStreak || 0))
    .slice(0, 5);

  return {
    data: {
      labels: top.map((h) => h.name),
      datasets: [
        {
          label: "Best streak",
          data: top.map((h) => h.bestStreak || 0),
          backgroundColor: top.map((h) => h.color || "#3b82f6")
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  };
}

// PUBLIC_INTERFACE
export function buildTaskThroughput(tasks, { endISO }) {
  /**
   * Tasks completed by week (bar) + cumulative completed (line).
   * Week is keyed by startOfWeekISO (Mon).
   */
  const completedDates = tasks
    .filter((t) => t.status === "done" && t.completedAt)
    .map((t) => t.completedAt)
    .filter(Boolean);

  const weekCounts = groupISOByWeek(completedDates, 1);
  const last8Weeks = [];
  const endWeek = startOfWeekISO(endISO, 1);
  // build 8 week starts ending at endWeek
  let cursor = endWeek;
  for (let i = 0; i < 8; i += 1) {
    last8Weeks.unshift(cursor);
    // subtract 7 days: naive string math not safe; use Date via parse in date.js? keep minimal:
    // We'll approximate by creating Date from cursor:
    const [y, m, d] = cursor.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 7);
    cursor = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }

  const weekly = last8Weeks.map((w) => weekCounts[w] || 0);
  const cumulative = [];
  weekly.reduce((acc, val) => {
    const next = acc + val;
    cumulative.push(next);
    return next;
  }, 0);

  const labels = last8Weeks.map((w) => w.slice(5));

  return {
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Completed (weekly)",
          data: weekly,
          backgroundColor: "rgba(6,182,212,0.35)",
          borderColor: "#06b6d4"
        },
        {
          type: "line",
          label: "Cumulative",
          data: cumulative,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.15)",
          tension: 0.25,
          yAxisID: "y"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } }
    }
  };
}

// PUBLIC_INTERFACE
export function buildTaskDistribution(tasks) {
  /** Doughnut: tasks by status and by priority. */
  const statusCounts = { todo: 0, "in-progress": 0, done: 0 };
  const priorityCounts = { low: 0, med: 0, high: 0 };

  for (const t of tasks) {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
  }

  const status = {
    data: {
      labels: ["Todo", "In-Progress", "Done"],
      datasets: [
        {
          data: [statusCounts.todo, statusCounts["in-progress"], statusCounts.done],
          backgroundColor: ["rgba(100,116,139,0.35)", "rgba(59,130,246,0.35)", "rgba(6,182,212,0.35)"],
          borderColor: ["#64748b", "#3b82f6", "#06b6d4"]
        }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  };

  const priority = {
    data: {
      labels: ["Low", "Med", "High"],
      datasets: [
        {
          data: [priorityCounts.low, priorityCounts.med, priorityCounts.high],
          backgroundColor: ["rgba(100,116,139,0.35)", "rgba(59,130,246,0.35)", "rgba(239,68,68,0.30)"],
          borderColor: ["#64748b", "#3b82f6", "#EF4444"]
        }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  };

  return { status, priority };
}
