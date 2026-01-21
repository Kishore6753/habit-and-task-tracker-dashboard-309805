import React, { useMemo } from "react";
import "./App.css";
import { AppStateProvider, useAppState, useSyncRouteOnPopstate } from "./context/AppStateContext";
import { Layout } from "./components/Layout";
import { ToastStack } from "./components/ToastStack";
import { DashboardPage } from "./pages/DashboardPage";
import { HabitsPage } from "./pages/HabitsPage";
import { TasksPage } from "./pages/TasksPage";
import { SettingsPage } from "./pages/SettingsPage";

/**
 * Main App entry:
 * - Provides global state via AppStateProvider
 * - Implements a lightweight internal router based on window.location.pathname + state.filters.view
 * - Renders app shell (Layout) and the active view
 */

function RouterView() {
  const { state } = useAppState();
  useSyncRouteOnPopstate();

  const view = state.filters?.view || "dashboard";

  const page = useMemo(() => {
    if (view === "habits") return <HabitsPage />;
    if (view === "tasks") return <TasksPage />;
    if (view === "settings") return <SettingsPage />;
    return <DashboardPage />;
  }, [view]);

  return (
    <Layout>
      {page}
      <ToastStack />
    </Layout>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Application root component. */
  return (
    <AppStateProvider>
      <RouterView />
    </AppStateProvider>
  );
}

export default App;
