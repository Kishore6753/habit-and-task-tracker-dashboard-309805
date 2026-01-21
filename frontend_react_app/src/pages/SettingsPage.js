import React, { useRef, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAppState } from "../context/AppStateContext";
import { downloadJSON, getStorageKey, readJSONFile } from "../utils/storage";

// PUBLIC_INTERFACE
export function SettingsPage() {
  /** Settings: import/export JSON and reset demo data. */
  const { state, actions } = useAppState();
  const fileRef = useRef(null);
  const [error, setError] = useState("");

  return (
    <div className="grid gap-4">
      <Card title="Data">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Export</p>
            <p className="mt-1 text-sm text-slate-600">Download your data as JSON.</p>
            <div className="mt-3">
              <Button
                variant="primary"
                onClick={() => downloadJSON("habit-task-tracker-export.json", { version: 1, data: state })}
              >
                Export JSON
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Import</p>
            <p className="mt-1 text-sm text-slate-600">Upload a previously exported JSON file.</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="block w-full text-sm"
                aria-label="Import JSON file"
                onChange={async (e) => {
                  setError("");
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const json = await readJSONFile(file);
                    actions.importState(json);
                  } catch (err) {
                    setError(err.message || "Import failed");
                  } finally {
                    e.target.value = "";
                  }
                }}
              />
            </div>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </div>
        </div>
      </Card>

      <Card title="Demo data">
        <p className="text-sm text-slate-600">
          Resets habits/tasks back to the initial demo dataset. This will overwrite localStorage key{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5">{getStorageKey()}</code>.
        </p>
        <div className="mt-3">
          <Button variant="danger" onClick={() => actions.resetDemoData()}>
            Reset demo data
          </Button>
        </div>
      </Card>
    </div>
  );
}
