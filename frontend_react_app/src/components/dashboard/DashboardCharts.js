import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Card } from "../ui/Card";
import { useAppState } from "../../context/AppStateContext";
import { buildHabitCompletionLast30Days, buildStreakLeaders, buildTaskDistribution, buildTaskThroughput } from "../../utils/charts";
import { getTodayISO } from "../../utils/date";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

// PUBLIC_INTERFACE
export function DashboardCharts() {
  /** Analytics dashboard charts. */
  const { state } = useAppState();
  const endISO = state.filters?.dateRange?.endISO || getTodayISO();

  const habitCompletion = useMemo(
    () => buildHabitCompletionLast30Days(state.habits || [], { endISO }),
    [state.habits, endISO]
  );
  const streakLeaders = useMemo(() => buildStreakLeaders(state.habits || []), [state.habits]);
  const throughput = useMemo(() => buildTaskThroughput(state.tasks || [], { endISO }), [state.tasks, endISO]);
  const distribution = useMemo(() => buildTaskDistribution(state.tasks || []), [state.tasks]);

  return (
    <div className="grid gap-4">
      <Card title="Habit completion (last 30 days)">
        <div className="h-[260px]">
          <Line data={habitCompletion.data} options={habitCompletion.options} />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Streak leaders (top 5)">
          <div className="h-[260px]">
            <Bar data={streakLeaders.data} options={streakLeaders.options} />
          </div>
        </Card>

        <Card title="Tasks by status">
          <div className="h-[260px]">
            <Doughnut data={distribution.status.data} options={distribution.status.options} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Task throughput (weekly + cumulative)">
          <div className="h-[260px]">
            <Bar data={throughput.data} options={throughput.options} />
          </div>
        </Card>

        <Card title="Tasks by priority">
          <div className="h-[260px]">
            <Doughnut data={distribution.priority.data} options={distribution.priority.options} />
          </div>
        </Card>
      </div>
    </div>
  );
}
