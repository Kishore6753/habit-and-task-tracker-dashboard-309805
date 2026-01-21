/**
 * Versioned localStorage persistence.
 * Stored under key: "httracker.state"
 *
 * Schema:
 * {
 *   version: number,
 *   data: AppState
 * }
 */

const STORAGE_KEY = "httracker.state";
const CURRENT_VERSION = 1;

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

  // Example migration placeholder:
  // if (version === 0) { ...; return migrated; }

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
      const parsed = safeParse(String(reader.result || ""));
      if (!parsed) reject(new Error("Invalid JSON"));
      else resolve(parsed);
    };
    reader.readAsText(file);
  });
}
