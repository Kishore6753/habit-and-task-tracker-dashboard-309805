# Habit & Task Tracker (React SPA)

Offline-first single-page app for tracking habits and tasks with analytics dashboards. All data persists to `localStorage` (no backend calls).

## Features

- **Habits**
  - Create / edit / delete habits
  - Quick toggle completion **for today**
  - 30-day grid view per habit
  - Auto-calculated **current streak** + **best streak** (daily streak logic)
- **Tasks**
  - Create / edit / delete tasks
  - **Kanban board** with drag-and-drop between: Todo / In-Progress / Done
  - Quick-add input
  - Filters: status, priority, due window, tags + global search
- **Dashboard**
  - Chart.js via `react-chartjs-2`:
    - Habit completion count over last 30 days (line)
    - Streak leaders top 5 (bar)
    - Task throughput (weekly bar + cumulative line)
    - Tasks by status + priority (doughnut)
- **Settings**
  - Export JSON / Import JSON (versioned)
  - Local rolling backups + restore
  - Reset demo data

## LocalStorage schema

Key: `httracker.state`

Value:

```json
{
  "version": 1,
  "data": {
    "habits": [],
    "tasks": [],
    "filters": {
      "view": "dashboard|habits|tasks|settings",
      "search": "",
      "dateRange": { "preset": "last30|today", "startISO": null, "endISO": "YYYY-MM-DD" },
      "task": { "status": "all|todo|in-progress|done", "priority": "all|low|med|high", "dueWindow": "all|overdue|next7|nodue", "tag": "all|<tag>" }
    },
    "ui": { "toasts": [] }
  }
}
```

### Migrations

`src/utils/storage.js` contains `migrateState()`; currently v1 is the initial schema.

## Export / Import (v2) and recovery

### Export format (v2)

Exports are downloaded as files named like:

`habit-tracker-backup-YYYYMMDD-HHmm.json`

The JSON is versioned and includes metadata:

```json
{
  "metadata": { "version": 2, "exportedAt": "2026-01-21T12:34:56.000Z", "app": "HabitTaskTracker" },
  "data": {
    "habits": [],
    "tasks": [],
    "settings": { "filters": { } }
  }
}
```

The app also supports importing older v1 exports (`{ version: 1, data: ... }`).

### Import modes

- **Merge (recommended)**: Deduplicates by `id`. If an item exists in both, the newest wins (by `updatedAt` if present). Missing IDs are generated.
- **Replace**: Before overwriting, the app automatically:
  1) saves a local backup snapshot
  2) triggers an export download of your current data

### Local backups / restore

Settings keeps a rolling backup history in `localStorage` (key: `app_backups`) storing the last **3** snapshots.

Use **Settings → Restore last backup** to quickly roll back from an accidental replace/import.

## Styling / Theme colors

Tailwind is configured in `tailwind.config.js` with the style guide colors:

- Primary: `#3b82f6`
- Secondary: `#64748b`
- Success: `#06b6d4`
- Error: `#EF4444`
- Background: `#f9fafb`
- Surface: `#ffffff`
- Text: `#111827`

Update these in `tailwind.config.js` to customize.

## Run

```bash
npm start
```

App runs on port **3000** in this template.
