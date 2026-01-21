import { diffDays, getTodayISO } from "./date";

/**
 * Streak logic: only daily streaks are computed by consecutive days.
 * (Weekly/custom frequencies can be extended later.)
 */

// PUBLIC_INTERFACE
export function calculateDailyStreaks(datesCompleted, todayISO = getTodayISO()) {
  /**
   * Compute current streak and best streak given completed ISO dates.
   * Returns: { currentStreak, bestStreak }
   */
  const set = new Set((datesCompleted || []).slice().sort());
  if (set.size === 0) return { currentStreak: 0, bestStreak: 0 };

  const sorted = Array.from(set).sort(); // asc
  let best = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const delta = diffDays(prev, cur);
    if (delta === 1) {
      run += 1;
    } else if (delta === 0) {
      // ignore
    } else {
      best = Math.max(best, run);
      run = 1;
    }
  }
  best = Math.max(best, run);

  // Current streak: count back from today; allow today missing but yesterday present => 0?
  // We'll define "current streak" as consecutive days ending today if today completed,
  // else ending yesterday (common UX) to keep streak visible.
  let anchor = todayISO;
  if (!set.has(anchor)) {
    const yesterday = getTodayISO() === todayISO ? null : null;
    // Use yesterday by subtracting 1 day by diff on strings is tricky; instead:
  }

  // Compute current streak by scanning backwards from today or yesterday.
  // If today not complete, start from the latest complete date only if it's yesterday.
  let startISO = todayISO;
  if (!set.has(startISO)) {
    // Find yesterday by finding last complete and checking if it's exactly 1 day before today.
    const last = sorted[sorted.length - 1];
    if (diffDays(last, todayISO) === 1) startISO = last;
    else return { currentStreak: 0, bestStreak: best };
  }

  let current = 0;
  let cursor = startISO;
  // Walk backward while completed exists; decrement by 1 day via diffDays search in sorted
  // We'll do a simple loop with string stepping using the known sorted list.
  // Since dates are ISO, we can traverse using set+date parsing with diffDays comparisons.
  // We'll iterate by scanning backwards in sorted starting from the index of cursor.
  const idx = sorted.indexOf(cursor);
  for (let i = idx; i >= 0; i -= 1) {
    if (i === idx) {
      current = 1;
      continue;
    }
    const prev = sorted[i];
    const next = sorted[i + 1];
    if (diffDays(prev, next) === 1) current += 1;
    else break;
  }

  return { currentStreak: current, bestStreak: best };
}
