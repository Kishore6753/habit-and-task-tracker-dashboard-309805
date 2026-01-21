/**
 * Date utilities used across habits/tasks.
 * Dates are stored as YYYY-MM-DD strings (local date, not UTC).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// PUBLIC_INTERFACE
export function toISODateString(date) {
  /** Convert a Date to YYYY-MM-DD in local time. */
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// PUBLIC_INTERFACE
export function parseISODateString(iso) {
  /** Parse YYYY-MM-DD into a Date in local time. */
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

// PUBLIC_INTERFACE
export function addDays(iso, deltaDays) {
  /** Add days to ISO string (local time). */
  const dt = parseISODateString(iso);
  const next = new Date(dt.getTime() + deltaDays * MS_PER_DAY);
  return toISODateString(next);
}

// PUBLIC_INTERFACE
export function diffDays(aISO, bISO) {
  /** Difference in whole days (b - a). */
  const a = parseISODateString(aISO);
  const b = parseISODateString(bISO);
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

// PUBLIC_INTERFACE
export function getTodayISO() {
  /** Today's date in YYYY-MM-DD. */
  return toISODateString(new Date());
}

// PUBLIC_INTERFACE
export function getLastNDaysRange(n, endISO = getTodayISO()) {
  /** Returns array of ISO dates of length n ending at endISO (inclusive). */
  const dates = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    dates.push(addDays(endISO, -i));
  }
  return dates;
}

// PUBLIC_INTERFACE
export function startOfWeekISO(iso, weekStartsOn = 1) {
  /**
   * Compute ISO for start of week (default Monday=1, Sunday=0).
   */
  const d = parseISODateString(iso);
  const day = d.getDay(); // 0..6, Sun..Sat
  const diff = (day - weekStartsOn + 7) % 7;
  const start = new Date(d.getTime() - diff * MS_PER_DAY);
  return toISODateString(start);
}

// PUBLIC_INTERFACE
export function groupISOByWeek(isoDates, weekStartsOn = 1) {
  /**
   * Groups ISO dates into buckets keyed by week start ISO.
   * Returns: { [weekStartISO]: count }
   */
  const counts = {};
  for (const iso of isoDates) {
    const wk = startOfWeekISO(iso, weekStartsOn);
    counts[wk] = (counts[wk] || 0) + 1;
  }
  return counts;
}

// PUBLIC_INTERFACE
export function clampISOToRange(iso, startISO, endISO) {
  /** Clamp iso within [startISO, endISO]. */
  if (iso < startISO) return startISO;
  if (iso > endISO) return endISO;
  return iso;
}
