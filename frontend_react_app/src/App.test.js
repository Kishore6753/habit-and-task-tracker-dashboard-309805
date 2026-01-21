import { render, screen } from "@testing-library/react";
import App from "./App";
import { validateAndNormalizeImportPayload } from "./utils/storage";

test("renders dashboard header", () => {
  render(<App />);
  expect(screen.getByText(/Habit & Task Tracker/i)).toBeInTheDocument();
});

test("import validator: happy path v2", () => {
  const payload = {
    metadata: { version: 2, exportedAt: new Date().toISOString(), app: "HabitTaskTracker" },
    data: {
      habits: [{ id: "h1", name: "Drink Water", datesCompleted: ["2026-01-01"], updatedAt: "2026-01-02T00:00:00Z" }],
      tasks: [{ id: "t1", title: "Buy milk", status: "todo", priority: "med", updatedAt: "2026-01-02T00:00:00Z" }],
      settings: { filters: { view: "dashboard", search: "" } }
    }
  };

  const res = validateAndNormalizeImportPayload(payload);
  expect(res.ok).toBe(true);
  expect(res.normalized.metadata.app).toBe("HabitTaskTracker");
  expect(res.normalized.habits.length).toBe(1);
  expect(res.normalized.tasks.length).toBe(1);
});

test("import validator: rejects wrong app id", () => {
  const payload = {
    metadata: { version: 2, exportedAt: new Date().toISOString(), app: "OtherApp" },
    data: { habits: [], tasks: [], settings: {} }
  };

  const res = validateAndNormalizeImportPayload(payload);
  expect(res.ok).toBe(false);
  expect(res.message).toMatch(/not exported from/i);
});
