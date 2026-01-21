import React from "react";
import { FilterBar } from "../components/FilterBar";
import { DashboardCharts } from "../components/dashboard/DashboardCharts";

// PUBLIC_INTERFACE
export function DashboardPage() {
  /** Dashboard page with charts + date range filter. */
  return (
    <div className="grid gap-4">
      <FilterBar mode="dashboard" />
      <DashboardCharts />
    </div>
  );
}
