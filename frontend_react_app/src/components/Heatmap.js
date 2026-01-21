import React, { useMemo, useState } from "react";
import { getTodayISO, parseISODateString, startOfWeekISO, toISODateString } from "../utils/date";

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

function getBucket(value) {
  // 5 buckets; binary today but keep scale for extensibility
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
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
  getStatus,
  onToggle,
  title,
  description
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

  const anyCompleted = useMemo(() => {
    for (const iso of dates) {
      if (getStatus?.(iso)) return true;
    }
    return false;
  }, [dates, getStatus]);

  const cellSize = "h-6 w-6"; // tap-friendly; works on mobile too
  const cellBase =
    "rounded-md border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  const tooltipText = useMemo(() => {
    if (!hover?.iso) return null;
    const done = Boolean(getStatus?.(hover.iso));
    return `${hover.iso} — ${done ? "✓ completed" : "0 not completed"}`;
  }, [hover, getStatus]);

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
                {monthLabels.map((m) => (
                  <div
                    key={`${m.weekIndex}-${m.label}`}
                    className="text-xs text-slate-500"
                    style={{ width: `${m.weekIndex * 28}px` }}
                  />
                ))}
                {/* overlay actual labels to align with weeks */}
                <div className="absolute left-0 top-0 flex">
                  {monthLabels.map((m) => (
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
                    {/* Show fewer labels for less clutter */}
                    {idx === 1 || idx === 3 || idx === 5 ? lbl : ""}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex gap-1">
                {columns.map((week, wIdx) => (
                  <div key={weekStarts[wIdx]} className="flex flex-col gap-1">
                    {week.map((iso) => {
                      const done = Boolean(getStatus?.(iso));
                      const bucket = getBucket(done ? 1 : 0);

                      const aria = `${iso}: ${done ? "completed" : "not completed"}. Click to toggle.`;

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
                          aria-pressed={done}
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
              </div>
              <span>More</span>
            </div>

            {!anyCompleted ? (
              <p className="mt-2 text-sm text-slate-600">
                No adherence data yet. Tap a day to mark it completed.
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
