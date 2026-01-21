/**
 * Versioned localStorage persistence + export/import helpers.
 *
 * Local app state is stored under key: "httracker.state"
 *
 * Export format (v2):
 * {
 *   "metadata": { "version": 2, "exportedAt": "ISO", "app": "HabitTaskTracker" },
 *   "data": { "habits": [], "tasks": [], "settings": { "filters": {...} } }
 * }
 *
 * Note: v1 exports are also supported:
 * { "version": 1, "data": <AppState> }
 */

import { nanoid } from "nanoid";

const STORAGE_KEY = "httracker.state";
const CURRENT_VERSION = 1;

const EXPORT_APP_ID = "HabitTaskTracker";
const EXPORT_SUPPORTED_VERSIONS = [1, 2];
const MAX_IMPORT_BYTES = 5 * 1024 * 1024; // 5MB

const BACKUP_HISTORY_KEY = "app_backups";
const MAX_BACKUPS = 3;

// PUBLIC_INTERFACE
export function getStorageKey() {
  /** Returns the localStorage key used by this app. */
  return STORAGE_KEY;
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isPlainObject(v) {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function isISODateString(v) {
  // minimal YYYY-MM-DD check or full ISO date-time; accept both
  if (typeof v !== "string") return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
  if (!Number.isNaN(Date.parse(v))) return true;
  return false;
}

function coerceNumber(v, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function coerceString(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function parseMaybeDateMs(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function getItemUpdatedAtMs(item) {
  // Prefer updatedAt; fall back to createdAt; else 0.
  if (!item || typeof item !== "object") return 0;
  return Math.max(parseMaybeDateMs(item.updatedAt), parseMaybeDateMs(item.createdAt));
}

function normalizeHabit(raw) {
  if (!isPlainObject(raw)) return null;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : nanoid();
  const name = coerceString(raw.name, "").trim();
  if (!name) return null;

  const datesCompleted = safeArray(raw.datesCompleted).filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d));
  const frequency = coerceString(raw.frequency, "daily") || "daily";
  const description = coerceString(raw.description, "");
  const color = typeof raw.color === "string" ? raw.color : "#3b82f6";

  return {
    id,
    name,
    description,
    frequency,
    datesCompleted,
    streak: coerceNumber(raw.streak, 0),
    bestStreak: coerceNumber(raw.bestStreak, 0),
    color,
    // keep optional bookkeeping if present
    createdAt: isISODateString(raw.createdAt) ? raw.createdAt : undefined,
    updatedAt: isISODateString(raw.updatedAt) ? raw.updatedAt : undefined
  };
}

function normalizeTask(raw) {
  if (!isPlainObject(raw)) return null;
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id : nanoid();
  const title = coerceString(raw.title, "").trim();
  if (!title) return null;

  const status = ["todo", "in-progress", "done"].includes(raw.status) ? raw.status : "todo";
  const priority = ["low", "med", "high"].includes(raw.priority) ? raw.priority : "med";
  const description = coerceString(raw.description, "");
  const tags = safeArray(raw.tags).filter((t) => typeof t === "string").slice(0, 50);
  const dueDate = raw.dueDate == null ? null : (typeof raw.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate) ? raw.dueDate : null);
  const completedAt =
    raw.completedAt == null
      ? null
      : (typeof raw.completedAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.completedAt) ? raw.completedAt : null);

  return {
    id,
    title,
    description,
    status,
    priority,
    dueDate,
    tags,
    completedAt,
    createdAt: isISODateString(raw.createdAt) ? raw.createdAt : undefined,
    updatedAt: isISODateString(raw.updatedAt) ? raw.updatedAt : undefined
  };
}

/**
 * Convert a v1/v2 export payload into a normalized "incoming data" object:
 * { version, habits, tasks, settings, metadata }
 */
function normalizeImportPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, code: "EMPTY", message: "Empty file." };
  }

  // v2
  if (isPlainObject(payload.metadata) && isPlainObject(payload.data)) {
    const md = payload.metadata;
    const version = md.version;
    if (!EXPORT_SUPPORTED_VERSIONS.includes(version)) {
      return { ok: false, code: "UNSUPPORTED_VERSION", message: `Unsupported export version: ${version}` };
    }
    if (md.app !== EXPORT_APP_ID) {
      return { ok: false, code: "WRONG_APP", message: "This file was not exported from HabitTaskTracker." };
    }

    const data = payload.data;
    if (!isPlainObject(data)) return { ok: false, code: "INVALID_SCHEMA", message: "Invalid export schema." };

    const habits = safeArray(data.habits).map(normalizeHabit).filter(Boolean);
    const tasks = safeArray(data.tasks).map(normalizeTask).filter(Boolean);
    const settings = isPlainObject(data.settings) ? data.settings : {};

    // minimal validation: if arrays exist but nothing validated, treat as invalid
    if (Array.isArray(data.habits) && data.habits.length > 0 && habits.length === 0) {
      return { ok: false, code: "INVALID_HABITS", message: "Invalid habits array." };
    }
    if (Array.isArray(data.tasks) && data.tasks.length > 0 && tasks.length === 0) {
      return { ok: false, code: "INVALID_TASKS", message: "Invalid tasks array." };
    }

    return {
      ok: true,
      version,
      metadata: md,
      habits,
      tasks,
      settings
    };
  }

  // v1: { version: 1, data: <AppState> }
  if (typeof payload.version === "number" && isPlainObject(payload.data)) {
    const version = payload.version;
    if (!EXPORT_SUPPORTED_VERSIONS.includes(version)) {
      return { ok: false, code: "UNSUPPORTED_VERSION", message: `Unsupported export version: ${version}` };
    }

    const data = payload.data;
    const habits = safeArray(data.habits).map(normalizeHabit).filter(Boolean);
    const tasks = safeArray(data.tasks).map(normalizeTask).filter(Boolean);

    if (Array.isArray(data.habits) && data.habits.length > 0 && habits.length === 0) {
      return { ok: false, code: "INVALID_HABITS", message: "Invalid habits array." };
    }
    if (Array.isArray(data.tasks) && data.tasks.length > 0 && tasks.length === 0) {
      return { ok: false, code: "INVALID_TASKS", message: "Invalid tasks array." };
    }

    // In v1, "settings" can map to filters if present.
    return {
      ok: true,
      version,
      metadata: { version: 1, app: EXPORT_APP_ID, exportedAt: null },
      habits,
      tasks,
      settings: {
        filters: isPlainObject(data.filters) ? data.filters : undefined
      }
    };
  }

  return { ok: false, code: "INVALID_SCHEMA", message: "Unrecognized export format." };
}

// PUBLIC_INTERFACE
export function migrateState(raw) {
  /**
   * Migrate from older versions to CURRENT_VERSION.
   * For now, v1 is the initial schema. If unknown, return null to trigger seed.
   */
  if (!raw || typeof raw !== "object") return null;

  const version = typeof raw.version === "number" ? raw.version : 0;
  const data = raw.data;

  if (version === CURRENT_VERSION && data) return data;

  return null;
}

// PUBLIC_INTERFACE
export function getStateFromStorage() {
  /** Load AppState from localStorage (migrated). Returns null if none/invalid. */
  if (typeof window === "undefined" || !window.localStorage) return null;
  const raw = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return migrateState(raw);
}

// PUBLIC_INTERFACE
export function setStateToStorage(state) {
  /** Persist AppState to localStorage with version envelope. */
  if (typeof window === "undefined" || !window.localStorage) return;
  const payload = { version: CURRENT_VERSION, data: state };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// PUBLIC_INTERFACE
export function makeExportFilename(date = new Date()) {
  /** Build export filename like habit-tracker-backup-YYYYMMDD-HHmm.json */
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  return `habit-tracker-backup-${yyyy}${mm}${dd}-${hh}${min}.json`;
}

// PUBLIC_INTERFACE
export function buildExportPayloadV2(appState) {
  /** Build export payload (v2) from current app state. */
  return {
    metadata: {
      version: 2,
      exportedAt: new Date().toISOString(),
      app: EXPORT_APP_ID
    },
    data: {
      habits: safeArray(appState?.habits),
      tasks: safeArray(appState?.tasks),
      settings: {
        filters: appState?.filters || {}
      }
    }
  };
}

// PUBLIC_INTERFACE
export function downloadJSON(filename, data) {
  /** Trigger a client-side download of JSON data. */
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// PUBLIC_INTERFACE
export function readJSONFile(file) {
  /** Read a JSON file from an <input type="file"> selection. */
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsed = safeParse(text);
      if (!parsed) reject(new Error("Invalid JSON"));
      else resolve(parsed);
    };
    reader.readAsText(file);
  });
}

// PUBLIC_INTERFACE
export function validateImportFile(file) {
  /**
   * Validate file before reading: type and size.
   * Returns { ok: true, warnings: [] } or { ok: false, message }.
   */
  if (!file) return { ok: false, message: "No file selected." };

  const warnings = [];
  if (file.size === 0) return { ok: false, message: "Empty file." };
  if (file.size > MAX_IMPORT_BYTES) warnings.push("This file is larger than 5MB. Import may be slow.");

  // Some browsers may provide empty type; accept .json name too.
  const isJsonType =
    file.type === "application/json" ||
    file.type === "text/json" ||
    file.name.toLowerCase().endsWith(".json") ||
    file.type === "";
  if (!isJsonType) return { ok: false, message: "Only JSON files are supported." };

  return { ok: true, warnings };
}

// PUBLIC_INTERFACE
export function validateAndNormalizeImportPayload(payload) {
  /**
   * Validate/normalize v1/v2 export payload.
   * Returns:
   * - { ok: true, normalized: { version, habits, tasks, settings, metadata } }
   * - { ok: false, message, code }
   */
  const res = normalizeImportPayload(payload);
  if (!res.ok) return { ok: false, message: res.message, code: res.code };
  return { ok: true, normalized: res };
}

function mergeByIdKeepNewest(existing, incoming) {
  const map = new Map();
  for (const item of existing) {
    if (item && typeof item.id === "string") map.set(item.id, item);
  }

  let added = 0;
  let updated = 0;

  for (const raw of incoming) {
    if (!raw || typeof raw.id !== "string") continue;
    const current = map.get(raw.id);
    if (!current) {
      map.set(raw.id, raw);
      added += 1;
    } else {
      const curMs = getItemUpdatedAtMs(current);
      const nextMs = getItemUpdatedAtMs(raw);
      if (nextMs >= curMs) {
        map.set(raw.id, { ...current, ...raw });
        updated += 1;
      }
    }
  }

  return {
    items: Array.from(map.values()),
    stats: { added, updated }
  };
}

function normalizeIncomingIds(items, makeNormalize) {
  // Ensure all items have an id and de-dup within the incoming list.
  const seen = new Set();
  const normalized = [];

  for (const it of items) {
    const n = makeNormalize(it);
    if (!n) continue;
    let id = n.id;
    if (!id || typeof id !== "string") id = nanoid();

    while (seen.has(id)) id = nanoid();
    seen.add(id);

    normalized.push({ ...n, id });
  }

  return normalized;
}

// PUBLIC_INTERFACE
export function applyImportToState(currentState, normalizedImport, mode) {
  /**
   * Apply normalized import payload to current AppState.
   *
   * mode:
   * - "merge": merge habits/tasks by id; keep newest by updatedAt; create ids for missing.
   * - "replace": replace habits/tasks + (optionally) filters (settings.filters). Keeps ui.toasts.
   *
   * Returns:
   * { ok: true, nextState, summary: { mode, habits: {...}, tasks: {...}, changed: boolean } }
   */
  const current = currentState || {};
  const incoming = normalizedImport || {};
  const importMode = mode === "replace" ? "replace" : "merge";

  const incomingHabits = normalizeIncomingIds(incoming.habits || [], normalizeHabit);
  const incomingTasks = normalizeIncomingIds(incoming.tasks || [], normalizeTask);

  if (importMode === "replace") {
    const next = {
      ...current,
      habits: incomingHabits,
      tasks: incomingTasks,
      // replace filters only if provided; else keep current filters
      filters: isPlainObject(incoming.settings?.filters) ? incoming.settings.filters : current.filters,
      // preserve existing UI toasts (avoid wiping notifications)
      ui: { ...current.ui, toasts: current.ui?.toasts || [] }
    };

    const changed =
      JSON.stringify(current.habits || []) !== JSON.stringify(next.habits || []) ||
      JSON.stringify(current.tasks || []) !== JSON.stringify(next.tasks || []) ||
      JSON.stringify(current.filters || {}) !== JSON.stringify(next.filters || {});

    return {
      ok: true,
      nextState: next,
      summary: {
        mode: "replace",
        habits: { imported: incomingHabits.length },
        tasks: { imported: incomingTasks.length },
        changed
      }
    };
  }

  // merge mode
  const mergedHabits = mergeByIdKeepNewest(safeArray(current.habits), incomingHabits);
  const mergedTasks = mergeByIdKeepNewest(safeArray(current.tasks), incomingTasks);

  const next = {
    ...current,
    habits: mergedHabits.items,
    tasks: mergedTasks.items,
    // Merge mode does not overwrite filters by default (safer).
    ui: { ...current.ui, toasts: current.ui?.toasts || [] }
  };

  const changed =
    mergedHabits.stats.added + mergedHabits.stats.updated + mergedTasks.stats.added + mergedTasks.stats.updated > 0;

  return {
    ok: true,
    nextState: next,
    summary: {
      mode: "merge",
      habits: { ...mergedHabits.stats, imported: incomingHabits.length },
      tasks: { ...mergedTasks.stats, imported: incomingTasks.length },
      changed
    }
  };
}

// PUBLIC_INTERFACE
export function createLocalBackupEntry(appState, { reason = "manual" } = {}) {
  /**
   * Store a compact backup entry in localStorage history (rolling last 3).
   * Stores a compact JSON string (not a blob URL) for safety and portability.
   *
   * Returns created entry: { id, createdAt, reason, version, sizeBytes, payload }
   */
  if (typeof window === "undefined" || !window.localStorage) return null;

  const payload = buildExportPayloadV2(appState);
  const payloadString = JSON.stringify(payload);
  const entry = {
    id: nanoid(),
    createdAt: new Date().toISOString(),
    reason,
    version: 2,
    sizeBytes: payloadString.length,
    payload: payloadString
  };

  const existing = getBackupHistory();
  const next = [entry, ...existing].slice(0, MAX_BACKUPS);
  window.localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(next));
  return entry;
}

// PUBLIC_INTERFACE
export function getBackupHistory() {
  /** Returns backup history entries (most recent first). */
  if (typeof window === "undefined" || !window.localStorage) return [];
  const raw = safeParse(window.localStorage.getItem(BACKUP_HISTORY_KEY));
  if (!Array.isArray(raw)) return [];
  return raw.filter((e) => isPlainObject(e) && typeof e.payload === "string").slice(0, MAX_BACKUPS);
}

// PUBLIC_INTERFACE
export function getLastBackupEntry() {
  /** Get the most recent backup entry or null. */
  const list = getBackupHistory();
  return list.length ? list[0] : null;
}

// PUBLIC_INTERFACE
export function restoreBackupEntry(entry) {
  /**
   * Validate and normalize a stored backup entry (payload string) and return normalized import.
   * Returns { ok: true, normalized } or { ok: false, message }.
   */
  if (!entry || !isPlainObject(entry) || typeof entry.payload !== "string") {
    return { ok: false, message: "No backup available." };
  }
  const payload = safeParse(entry.payload);
  if (!payload) return { ok: false, message: "Backup data is corrupted." };
  const validated = validateAndNormalizeImportPayload(payload);
  if (!validated.ok) return { ok: false, message: `Backup invalid: ${validated.message}` };
  return { ok: true, normalized: validated.normalized };
}
