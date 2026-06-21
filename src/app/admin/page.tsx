"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTeams, getDailyTask, getAllRecordsForDate } from "@/lib/firestore";
import type { Team, TeamDailyRecord } from "@/lib/types";
import LeaderboardPage from "../leaderboard/page";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function AdminDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [todayRecords, setTodayRecords] = useState<TeamDailyRecord[]>([]);
  const [hasTasksToday, setHasTasksToday] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = getTodayDate();
    Promise.all([getTeams(), getDailyTask(today), getAllRecordsForDate(today)])
      .then(([t, dt, r]) => {
        setTeams(t);
        setHasTasksToday(!!dt);
        setTodayRecords(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completedCount = todayRecords.filter((r) => r.isCompleted).length;
  const avgScore =
    todayRecords.length > 0
      ? Math.round(
          todayRecords.reduce((s, r) => s + r.dailyScore, 0) /
            todayRecords.length
        )
      : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border-color border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <StatCard label="Total Teams" value={teams.length} />
        <StatCard
          label="Tasks Today"
          value={hasTasksToday ? "Active" : "None"}
          accent={hasTasksToday}
        />
        <StatCard
          label="Completed"
          value={`${completedCount}/${todayRecords.length || teams.length}`}
        />
        <StatCard label="Avg Score" value={avgScore} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        <Link
          href="/admin/questions"
          className="group rounded-xl border border-border-color bg-bg-secondary p-4 hover:border-accent/40 hover:shadow-[var(--card-shadow-hover)] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-[13px] font-semibold text-text-primary group-hover:text-accent transition-colors">
              Add Questions
            </h3>
          </div>
          <p className="text-[11px] text-text-muted">Create daily tasks</p>
        </Link>

        <Link
          href="/admin/teams"
          className="group rounded-xl border border-border-color bg-bg-secondary p-4 hover:border-accent/40 hover:shadow-[var(--card-shadow-hover)] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-[13px] font-semibold text-text-primary group-hover:text-accent transition-colors">
              Progress
            </h3>
          </div>
          <p className="text-[11px] text-text-muted">Update scores</p>
        </Link>

        <Link
          href="/admin/manage-teams"
          className="group rounded-xl border border-border-color bg-bg-secondary p-4 hover:border-accent/40 hover:shadow-[var(--card-shadow-hover)] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-[13px] font-semibold text-text-primary group-hover:text-accent transition-colors">
              Manage Teams
            </h3>
          </div>
          <p className="text-[11px] text-text-muted">Edit names/members</p>
        </Link>

        <Link
          href="/admin/holidays"
          className="group rounded-xl border border-border-color bg-bg-secondary p-4 hover:border-accent/40 hover:shadow-[var(--card-shadow-hover)] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-[13px] font-semibold text-text-primary group-hover:text-accent transition-colors">
              Holidays
            </h3>
          </div>
          <p className="text-[11px] text-text-muted">Set holidays</p>
        </Link>
      </div>

      <div className="rounded-xl border border-border-color bg-bg-secondary overflow-hidden pt-4 pb-8">
        <LeaderboardPage />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border-color bg-bg-secondary p-4">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div
        className={`text-xl font-bold ${
          accent ? "text-accent" : "text-text-primary"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
