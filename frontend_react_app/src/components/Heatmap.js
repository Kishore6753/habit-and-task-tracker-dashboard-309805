import React, { useMemo, useState } from "react";
import { addDays, diffDays, getTodayISO, parseISODateString, startOfWeekISO, toISODateString } from "../utils/date";

/**
 * Heat bucket colors (future-proof 5 buckets).
 * For now (binary), we map:
 * 0 -> gray-200 (very light)
 * 1 -> primary (blue-500-ish)
 */
const BUCKET_CLASSES = [
  "bg-slate-200 border-slate-200", // 0
  "bg-blue-500 border-blue-500", // 1
  "bg-blue-600 border-blue-600", // 2 (unused currently)
  "bg-blue-700 border-blue-700", // 3 (unused currently)
  "bg-blue-800 border-blue-800" // 4 (unused currently)
];

function dayLabelShort(date) {
  // local date; short label for row headings
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function monthLabelShort(date) {
  return date.toLocaleDateString(undefined, { month: "short" });
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalizeThresholds(thresholds) {
  // Default keeps existing binary behavior: 0->bucket0, >=1->bucket1.
  const defaults = { mode: "max", max: 1, buckets: [1, 2, 3, 4] };
  const t = thresholds && typeof thresholds === "object" ? thresholds : {};
  const mode = t.mode === "buckets" ? "buckets" : "max";
  const max =
    typeof t.max === "number" && Number.isFinite(t.max) && t.max >= 1 ? Math.floor(t.max) : defaults.max;

  const bucketsRaw = Array.isArray(t.buckets) ? t.buckets : defaults.buckets;
  const buckets = bucketsRaw
    .map((n) => (typeof n === "number" && Number.isFinite(n) ? Math.floor(n) : null))
    .filter((n) => typeof n === "number" && n >= 1)
    .slice(0, 4);

  const isStrictAsc = buckets.length === 4 && buckets.every((v, i) => (i === 0 ? true : v > buckets[i - 1]));
  return { mode, max, buckets: isStrictAsc ? buckets : defaults.buckets };
}

function getBucketByThresholds(value, thresholds) {
  // 5 buckets (0..4). 0 is always empty.
  if (value <= 0) return 0;

  const t = normalizeThresholds(thresholds);
  if (t.mode === "buckets") {
    // buckets are cutoffs for bucket 1..4
    if (value <= t.buckets[0]) return 1;
    if (value <= t.buckets[1]) return 2;
    if (value <= t.buckets[2]) return 3;
    return 4;
  }

  // "max" scaling: map 1..max to buckets 1..4
  const capped = Math.max(1, Math.min(value, t.max));
  const ratio = capped / t.max; // 0..1
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * Build a continuous date range aligned to start-of-week, for `weeks` weeks ending at `endISO`.
 * Returns an array of ISO strings of length weeks*7, and a parallel array of week-start ISO strings
 * for column labeling.
 */
function buildWeeksRange({ weeks, endISO, weekStartsOn }) {
  const end = endISO;
  const endWeekStart = startOfWeekISO(end, weekStartsOn);

  // Start at the beginning of the earliest week in the range
  const [y, m, d] = endWeekStart.split("-").map(Number);
  const startDate = new Date(y, m - 1, d);
  startDate.setDate(startDate.getDate() - (weeks - 1) * 7);

  const dates = [];
  const weekStarts = [];
  const cursor = new Date(startDate);

  for (let w = 0; w < weeks; w += 1) {
    const weekStartISO = toISODateString(cursor);
    weekStarts.push(weekStartISO);

    for (let i = 0; i < 7; i += 1) {
      const dt = new Date(cursor);
      dt.setDate(cursor.getDate() + i);
      dates.push(toISODateString(dt));
    }

    cursor.setDate(cursor.getDate() + 7);
  }

  return { dates, weekStarts };
}

// PUBLIC_INTERFACE
export function Heatmap({
  habitId,
  weeks = 12,
  endDateISO = getTodayISO(),
  weekStartsOn = 1, // Monday
  // Back-compat: if getCount is not provided, we treat getStatus as boolean completion (0/1).
  getStatus,
  getCount,
  onToggle,
  title,
  description,
  // Optional UI filtering: restrict rendered cells to this inclusive range.
  // When provided, days outside the range render as blank spacers (preserves week layout).
  filterRange,
  // Optional threshold configuration for coloring.
  // If omitted, default behavior stays binary.
  thresholds
}) {
  /**
   * Generic calendar-style heatmap.
   *
   * Props:
   * - habitId: string (used for stable IDs/aria)
   * - weeks: number (columns)
   * - endDateISO: YYYY-MM-DD (range ends at this date)
   * - weekStartsOn: 0|1 (Sun|Mon)
   * - getStatus: (isoDate: string) => boolean
   * - onToggle: (isoDate: string) => void
   */
  const [hover, setHover] = useState(null); // { iso, rect }

  const { dates, weekStarts } = useMemo(
    () => buildWeeksRange({ weeks: clamp(weeks, 4, 52), endISO: endDateISO, weekStartsOn }),
    [weeks, endDateISO, weekStartsOn]
  );

  const effectiveRange = useMemo(() => {
    if (!filterRange || typeof filterRange !== "object") return null;
    const startISO = typeof filterRange.startISO === "string" ? filterRange.startISO : null;
    const endISO = typeof filterRange.endISO === "string" ? filterRange.endISO : null;
    if (!startISO || !endISO) return null;
    if (startISO > endISO) return null;
    return { startISO, endISO };
  }, [filterRange]);

  // Arrange into columns (weeks), each with 7 rows (days)
  const columns = useMemo(() => {
    const out = [];
    for (let w = 0; w < weekStarts.length; w += 1) {
      const startIdx = w * 7;
      out.push(dates.slice(startIdx, startIdx + 7));
    }
    return out;
  }, [dates, weekStarts]);

  const dayRowLabels = useMemo(() => {
    // 7 labels; render only some to reduce clutter
    const base = parseISODateString(columns[0]?.[0] || endDateISO);
    const labels = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      labels.push(dayLabelShort(d));
    }
    return labels;
  }, [columns, endDateISO]);

  const monthLabels = useMemo(() => {
    // GitHub style: label month above first week it appears
    const labels = [];
    let lastMonth = null;
    for (let w = 0; w < weekStarts.length; w += 1) {
      const dt = parseISODateString(weekStarts[w]);
      const m = dt.getMonth();
      if (lastMonth === null || m !== lastMonth) {
        labels.push({ weekIndex: w, label: monthLabelShort(dt) });
        lastMonth = m;
      }
    }
    return labels;
  }, [weekStarts]);

  const getValue = useMemo(() => {
    if (typeof getCount === "function") return (iso) => getCount(iso) || 0;
    // Back-compat: boolean completion => 0/1
    return (iso) => (getStatus?.(iso) ? 1 : 0);
  }, [getCount, getStatus]);

  const anyCompleted = useMemo(() => {
    for (const iso of dates) {
      if (effectiveRange && (iso < effectiveRange.startISO || iso > effectiveRange.endISO)) continue;
      if (getValue(iso) > 0) return true;
    }
    return false;
  }, [dates, getValue, effectiveRange]);

  const cellSize = "h-6 w-6"; // tap-friendly; works on mobile too
  const cellBase =
    "rounded-md border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  const tooltipText = useMemo(() => {
    if (!hover?.iso) return null;
    const value = getValue(hover.iso);
    const done = value > 0;
    return `${hover.iso} — ${done ? `${value} completed` : "0 not completed"}`;
  }, [hover, getValue]);

  const legend = useMemo(() => {
    const t = normalizeThresholds(thresholds);

    if (t.mode === "buckets") {
      // Render 5 buckets with explicit cutoffs.
      const labels = [
        "0",
        `1–${t.buckets[0]}`,
        `${t.buckets[0] + 1}–${t.buckets[1]}`,
        `${t.buckets[1] + 1}–${t.buckets[2]}`,
        `${t.buckets[2] + 1}+`
      ];
      return { labels, mode: "buckets", thresholds: t };
    }

    // max-mode
    // If max=1, keep minimal legend similar to previous.
    if (t.max <= 1) {
      return { labels: ["0", "1+"], mode: "max", thresholds: t };
    }

    const q1 = Math.max(1, Math.ceil(t.max * 0.25));
    const q2 = Math.max(q1, Math.ceil(t.max * 0.5));
    const q3 = Math.max(q2, Math.ceil(t.max * 0.75));

    const labels = [
      "0",
      `1–${q1}`,
      `${q1 + 1}–${q2}`,
      `${q2 + 1}–${q3}`,
      `${q3 + 1}–${t.max}+`
    ];
    return { labels, mode: "max", thresholds: t };
  }, [thresholds]);

  // If we have an explicit range but the requested weeks window doesn't fully cover it,
  // we auto-expand the window so the filter doesn't appear "empty".
  const effectiveWeeks = useMemo(() => {
    if (!effectiveRange) return clamp(weeks, 4, 52);
    const spanDays = diffDays(effectiveRange.startISO, effectiveRange.endISO) + 1;
    const spanWeeks = Math.ceil(spanDays / 7);
    return clamp(Math.max(weeks, spanWeeks), 4, 104);
  }, [weeks, effectiveRange]);

  const { dates: dates2, weekStarts: weekStarts2 } = useMemo(
    () => buildWeeksRange({ weeks: effectiveWeeks, endISO: endDateISO, weekStartsOn }),
    [effectiveWeeks, endDateISO, weekStartsOn]
  );

  const columns2 = useMemo(() => {
    const out = [];
    for (let w = 0; w < weekStarts2.length; w += 1) {
      const startIdx = w * 7;
      out.push(dates2.slice(startIdx, startIdx + 7));
    }
    return out;
  }, [dates2, weekStarts2]);

  const monthLabels2 = useMemo(() => {
    const labels = [];
    let lastMonth = null;
    for (let w = 0; w < weekStarts2.length; w += 1) {
      const dt = parseISODateString(weekStarts2[w]);
      const m = dt.getMonth();
      if (lastMonth === null || m !== lastMonth) {
        labels.push({ weekIndex: w, label: monthLabelShort(dt) });
        lastMonth = m;
      }
    }
    return labels;
  }, [weekStarts2]);

  // For accessibility: spacer cells must not be focusable/clickable.
  const spacerClass = "bg-transparent border-transparent";

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2">
        {title ? <p className="text-sm font-semibold text-slate-900">{title}</p> : null}
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}

        <div className="relative overflow-x-auto">
          <div className="min-w-[520px]">
            {/* Month labels row */}
            <div className="mb-2 flex items-center gap-2">
              <div className="w-10" aria-hidden="true" />
              <div className="relative flex">
                {monthLabels2.map((m) => (
                  <div
                    key={`${m.weekIndex}-${m.label}`}
                    className="text-xs text-slate-500"
                    style={{ width: `${m.weekIndex * 28}px` }}
                  />
                ))}
                <div className="absolute left-0 top-0 flex">
                  {monthLabels2.map((m) => (
                    <div
                      key={`${m.weekIndex}-${m.label}-label`}
                      className="text-xs text-slate-500"
                      style={{ marginLeft: `${m.weekIndex * 28}px` }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Day labels */}
              <div className="flex w-10 flex-col gap-1 pt-1">
                {dayRowLabels.map((lbl, idx) => (
                  <div key={lbl} className="h-6 text-[11px] text-slate-500">
                    {idx === 1 || idx === 3 || idx === 5 ? lbl : ""}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex gap-1">
                {columns2.map((week, wIdx) => (
                  <div key={weekStarts2[wIdx]} className="flex flex-col gap-1">
                    {week.map((iso) => {
                      const outOfRange =
                        Boolean(effectiveRange) && (iso < effectiveRange.startISO || iso > effectiveRange.endISO);

                      if (outOfRange) {
                        // Render a non-interactive spacer to keep layout consistent.
                        return (
                          <span
                            key={iso}
                            className={[cellSize, "rounded-md border", spacerClass].join(" ")}
                            aria-hidden="true"
                          />
                        );
                      }

                      const value = getValue(iso);
                      const bucket = getBucketByThresholds(value, thresholds);

                      const isDone = value > 0;
                      const aria = `${iso}: ${value} completed. Click to toggle.`;

                      return (
                        <button
                          key={iso}
                          type="button"
                          className={[cellSize, cellBase, BUCKET_CLASSES[bucket]].join(" ")}
                          onClick={() => onToggle?.(iso)}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHover({ iso, rect });
                          }}
                          onMouseLeave={() => setHover(null)}
                          onFocus={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHover({ iso, rect });
                          }}
                          onBlur={() => setHover(null)}
                          aria-label={aria}
                          aria-pressed={isDone}
                          title={aria}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>Less</span>
              <div className="flex items-center gap-1" aria-label="Heatmap legend">
                <span className={["h-4 w-4 rounded border", BUCKET_CLASSES[0]].join(" ")} aria-hidden="true" />
                <span className={["h-4 w-4 rounded border", BUCKET_CLASSES[1]].join(" ")} aria-hidden="true" />
                {/* Only show extra buckets when thresholds imply more than binary scale */}
                {normalizeThresholds(thresholds).mode === "buckets" || normalizeThresholds(thresholds).max > 1 ? (
                  <>
                    <span className={["h-4 w-4 rounded border", BUCKET_CLASSES[2]].join(" ")} aria-hidden="true" />
                    <span className={["h-4 w-4 rounded border", BUCKET_CLASSES[3]].join(" ")} aria-hidden="true" />
                    <span className={["h-4 w-4 rounded border", BUCKET_CLASSES[4]].join(" ")} aria-hidden="true" />
                  </>
                ) : null}
              </div>
              <span>More</span>
              {/* Numeric legend labels for accessibility/clarity */}
              <div className="ml-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500" aria-label="Legend thresholds">
                {legend.labels.map((lbl, idx) => (
                  <span key={`${lbl}-${idx}`}>{idx === 0 ? `0: ${lbl}` : `${idx}: ${lbl}`}</span>
                ))}
              </div>
            </div>

            {!anyCompleted ? (
              <p className="mt-2 text-sm text-slate-600">
                No adherence data yet. Tap a day to mark it completed.
              </p>
            ) : null}

            {/* Subtle range hint when filter active */}
            {effectiveRange ? (
              <p className="mt-1 text-xs text-slate-500">
                Showing {effectiveRange.startISO} → {effectiveRange.endISO}
              </p>
            ) : null}
          </div>

          {/* Tooltip */}
          {hover?.rect && tooltipText ? (
            <div
              className="pointer-events-none fixed z-50 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-lg"
              style={{
                top: Math.min(window.innerHeight - 60, hover.rect.top - 40),
                left: Math.min(window.innerWidth - 220, hover.rect.left)
              }}
              role="status"
              aria-live="polite"
            >
              {tooltipText}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
