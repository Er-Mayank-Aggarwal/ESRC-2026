"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTeams, getDailyTask, getAllRecordsForDate } from "@/lib/firestore";
import type { Team, TeamDailyRecord } from "@/lib/types";

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/admin/questions"
          className="group rounded-xl border border-border-color bg-bg-secondary p-5 hover:border-accent/40 hover:shadow-[var(--card-shadow-hover)] transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              Add Daily Questions
            </h3>
          </div>
          <p className="text-xs text-text-muted">
            Add questions and distribute them randomly across teams.
          </p>
        </Link>

        <Link
          href="/admin/teams"
          className="group rounded-xl border border-border-color bg-bg-secondary p-5 hover:border-accent/40 hover:shadow-[var(--card-shadow-hover)] transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              Manage Teams
            </h3>
          </div>
          <p className="text-xs text-text-muted">
            Mark tasks complete and assign daily scores to teams.
          </p>
        </Link>
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
