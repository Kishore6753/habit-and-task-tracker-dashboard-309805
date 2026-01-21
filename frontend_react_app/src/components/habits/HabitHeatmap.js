import React, { useEffect, useMemo, useState } from "react";
import { Heatmap } from "../Heatmap";
import { addDays, getTodayISO } from "../../utils/date";
import {
  ensureHabitCompletionSchema,
  getHabitHeatmapSettings,
  isHabitCompletedOnDate,
  setHabitHeatmapSettings,
  toggleHabitCompletedOnDate
} from "../../utils/storage";

// PUBLIC_INTERFACE
export function HabitHeatmap({ habitId, weeks = 12, showControls = true }) {
  /** Habit-specific adherence heatmap backed by localStorage. */
  const [rev, setRev] = useState(0); // force refresh after toggles
  const [settings, setSettings] = useState(() => getHabitHeatmapSettings(habitId));

  useEffect(() => {
    // Initialize/migrate completion schema (safe no-op if already exists)
    // We do not require appState here; we only ensure the key is well-formed.
    ensureHabitCompletionSchema();
  }, []);

  useEffect(() => {
    // Keep settings in sync if habitId changes.
    setSettings(getHabitHeatmapSettings(habitId));
  }, [habitId]);

  const persistSettings = (patch) => {
    const next = { ...settings, ...patch };
    const saved = setHabitHeatmapSettings(habitId, next);
    setSettings(saved);
  };

  const endISO = getTodayISO();

  const computedRange = useMemo(() => {
    if (!settings?.dateRange?.enabled) return null;

    const preset = settings.dateRange.preset || "12m";
    if (preset === "custom") {
      if (settings.dateRange.startISO && settings.dateRange.endISO) {
        return { startISO: settings.dateRange.startISO, endISO: settings.dateRange.endISO };
      }
      return null;
    }

    // Presets: 4m/8m/12m interpreted as N*30 days for a simple offline approximation.
    const days = preset === "4m" ? 120 : preset === "8m" ? 240 : 360;
    const startISO = addDays(endISO, -(days - 1));
    return { startISO, endISO };
  }, [settings, endISO]);

  const thresholds = useMemo(() => {
    if (!settings?.thresholds?.enabled) return null;
    return {
      mode: settings.thresholds.mode,
      max: settings.thresholds.max,
      buckets: settings.thresholds.buckets
    };
  }, [settings]);

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
    <div className="grid gap-3">
      {showControls ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="grid gap-3 md:grid-cols-2">
            {/* Date range filter */}
            <fieldset className="rounded-xl border border-slate-100 bg-slate-50 p-3" aria-label="Heatmap date range filter">
              <legend className="text-sm font-semibold text-slate-900">Date range</legend>

              <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(settings?.dateRange?.enabled)}
                  onChange={(e) =>
                    persistSettings({ dateRange: { ...settings.dateRange, enabled: e.target.checked } })
                  }
                />
                Enable date range filter
              </label>

              <div className="mt-2 grid gap-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Preset</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    value={settings?.dateRange?.preset || "12m"}
                    onChange={(e) =>
                      persistSettings({ dateRange: { ...settings.dateRange, preset: e.target.value } })
                    }
                    disabled={!settings?.dateRange?.enabled}
                    aria-disabled={!settings?.dateRange?.enabled}
                  >
                    <option value="4m">Last 4 months</option>
                    <option value="8m">Last 8 months</option>
                    <option value="12m">Last 12 months</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>

                {settings?.dateRange?.enabled && (settings?.dateRange?.preset || "12m") === "custom" ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">Start date</span>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                        value={settings?.dateRange?.startISO || ""}
                        onChange={(e) =>
                          persistSettings({ dateRange: { ...settings.dateRange, startISO: e.target.value || null } })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-700">End date</span>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                        value={settings?.dateRange?.endISO || ""}
                        onChange={(e) =>
                          persistSettings({ dateRange: { ...settings.dateRange, endISO: e.target.value || null } })
                        }
                      />
                    </label>
                    <p className="text-xs text-slate-500 md:col-span-2">
                      Tip: If start/end are empty or invalid, the filter won’t apply (default behavior).
                    </p>
                  </div>
                ) : null}
              </div>
            </fieldset>

            {/* Intensity thresholds */}
            <fieldset
              className="rounded-xl border border-slate-100 bg-slate-50 p-3"
              aria-label="Heatmap intensity thresholds"
            >
              <legend className="text-sm font-semibold text-slate-900">Intensity</legend>

              <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(settings?.thresholds?.enabled)}
                  onChange={(e) =>
                    persistSettings({ thresholds: { ...settings.thresholds, enabled: e.target.checked } })
                  }
                />
                Enable intensity scaling
              </label>

              <div className="mt-2 grid gap-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Mode</span>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    value={settings?.thresholds?.mode || "max"}
                    onChange={(e) =>
                      persistSettings({ thresholds: { ...settings.thresholds, mode: e.target.value } })
                    }
                    disabled={!settings?.thresholds?.enabled}
                    aria-disabled={!settings?.thresholds?.enabled}
                  >
                    <option value="max">Max-based scale</option>
                    <option value="buckets">Custom buckets</option>
                  </select>
                </label>

                {settings?.thresholds?.enabled && (settings?.thresholds?.mode || "max") === "max" ? (
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">Max count</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                      value={settings?.thresholds?.max || 1}
                      onChange={(e) => {
                        const n = Math.max(1, Math.floor(Number(e.target.value || 1)));
                        persistSettings({ thresholds: { ...settings.thresholds, max: n } });
                      }}
                      disabled={!settings?.thresholds?.enabled}
                    />
                    <p className="mt-1 text-xs text-slate-500">Used to map counts into 4 color buckets.</p>
                  </label>
                ) : null}

                {settings?.thresholds?.enabled && (settings?.thresholds?.mode || "max") === "buckets" ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {["Bucket 1 cutoff", "Bucket 2 cutoff", "Bucket 3 cutoff", "Bucket 4 cutoff"].map((lbl, idx) => (
                      <label key={lbl} className="block">
                        <span className="mb-1 block text-sm font-medium text-slate-700">{lbl}</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                          value={settings?.thresholds?.buckets?.[idx] ?? [1, 2, 3, 4][idx]}
                          onChange={(e) => {
                            const current = Array.isArray(settings.thresholds.buckets)
                              ? settings.thresholds.buckets.slice(0, 4)
                              : [1, 2, 3, 4];
                            const v = Math.max(1, Math.floor(Number(e.target.value || 1)));
                            current[idx] = v;
                            persistSettings({ thresholds: { ...settings.thresholds, buckets: current } });
                          }}
                          disabled={!settings?.thresholds?.enabled}
                        />
                      </label>
                    ))}
                    <p className="text-xs text-slate-500 md:col-span-2">
                      Cutoffs must be strictly increasing (e.g., 1, 2, 3, 4). Invalid values fall back to defaults.
                    </p>
                  </div>
                ) : null}
              </div>
            </fieldset>
          </div>
        </div>
      ) : null}

      <Heatmap
        habitId={habitId}
        weeks={weeks}
        endDateISO={endISO}
        getStatus={getStatus}
        onToggle={onToggle}
        title="Adherence Heatmap"
        description="Tap a day to toggle completion. Stored locally (offline)."
        filterRange={computedRange}
        thresholds={thresholds}
      />
    </div>
  );
}
