"use client";

import InstallPWA from "@/components/InstallPWA";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getTeamById,
  getTeamDailyRecord,
  getTeamAllRecords,
  getLeaderboard,
  checkIsHoliday,
  getCompetitionDay,
} from "@/lib/firestore";
import type { Team, TeamDailyRecord, LeaderboardEntry } from "@/lib/types";
import { getTodayDateIST } from "@/lib/utils";

type Tab = "tasks" | "history" | "stats" | "leaderboard";

function getTodayDate(): string {
  return getTodayDateIST();
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function TeamDashboard() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [todayRecord, setTodayRecord] = useState<TeamDailyRecord | null>(null);
  const [allRecords, setAllRecords] = useState<TeamDailyRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [loading, setLoading] = useState(true);
  const [isHoliday, setIsHoliday] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    const today = getTodayDate();
    Promise.all([
      getTeamById(teamId),
      getTeamDailyRecord(teamId, today),
      getTeamAllRecords(teamId),
      getLeaderboard(),
      checkIsHoliday(today),
    ])
      .then(([t, tr, ar, lb, hol]) => {
        setTeam(t);
        setTodayRecord(tr);
        setAllRecords(ar);
        setLeaderboard(lb);
        setIsHoliday(hol);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [teamId]);

  const myRank = leaderboard.find((e) => e.teamId === teamId)?.rank ?? "—";
  const todayRank = todayRecord?.dailyRank && todayRecord.dailyRank > 0 ? todayRecord.dailyRank : "—";

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-5 w-5 rounded-full border-[1.5px] border-border-color border-t-accent animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-24 text-center">
        <p className="text-[13px] text-text-muted mb-3">Team not found</p>
        <Link href="/" className="text-[13px] text-accent hover:underline">
          ← Back to all teams
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "tasks", label: `Today's Tasks (Day ${getCompetitionDay(getTodayDate())})` },
    { key: "history", label: "History" },
    { key: "stats", label: "Statistics" },
    { key: "leaderboard", label: "Leaderboard" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[12px] text-text-muted hover:text-text-secondary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All Teams
        </Link>
        <InstallPWA />
      </div>


      {/* Team Header Card */}
      <div className="rounded-xl border border-border-color bg-bg-secondary p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/8 text-accent text-[15px] font-bold">
              {team.teamNumber}
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary tracking-tight leading-none">
                {team.teamName}
              </h1>
              <p className="text-[11px] text-text-muted mt-1 leading-none">
                {team.members.join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="rounded-lg border border-border-color bg-bg-primary px-4 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium leading-none">Rank</div>
              <div className="text-xl font-bold text-accent mt-1 leading-none">#{myRank}</div>
            </div>
            <div className="rounded-lg border border-border-color bg-bg-primary px-4 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium leading-none">Score</div>
              <div className="text-xl font-bold text-text-primary mt-1 leading-none">{team.totalScore}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5 rounded-lg border border-border-color bg-bg-secondary p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${
              activeTab === tab.key
                ? "bg-bg-primary text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "tasks" && <TasksTab record={todayRecord} isHoliday={isHoliday} />}
        {activeTab === "history" && <HistoryTab records={allRecords} />}
        {activeTab === "stats" && (
          <StatsTab team={team} todayRank={todayRank} overallRank={myRank} todayRecord={todayRecord} totalDays={allRecords.length} />
        )}
        {activeTab === "leaderboard" && <LeaderboardTab entries={leaderboard} currentTeamId={teamId} />}
      </div>
    </div>
  );
}

/* ─── Tab: Today's Tasks ─────────────────────────────────── */

function TasksTab({ record, isHoliday }: { record: TeamDailyRecord | null; isHoliday: boolean }) {
  const [qIdx, setQIdx] = useState(0);

  if (!record || !record.assignedQuestionIndices || record.assignedQuestionIndices.length === 0) {
    if (isHoliday) {
      return (
        <div className="rounded-xl border border-success/15 bg-success-bg p-10 text-center">
          <p className="text-[14px] font-semibold text-success mb-1">It&apos;s a Holiday! 🎉</p>
          <p className="text-[13px] text-success/80">Take a break today. No tasks are assigned.</p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-border-color bg-bg-secondary p-10 text-center">
        <p className="text-[13px] text-text-muted">No tasks assigned for today yet.</p>
      </div>
    );
  }

  // Need to fetch global questions since record only holds indices
  // For the user dashboard, since it's client-side we'll do a quick fetch
  // This is a bit of a hack but works for the in-memory store
  const [questions, setQuestions] = useState<string[]>([]);
  
  useEffect(() => {
    // Import here to avoid circular dependencies at the top level
    import("@/lib/firestore").then(({ getDailyTask }) => {
      getDailyTask(record.date).then(task => {
        if (task) {
          setQuestions(task.allQuestions);
        }
      });
    });
  }, [record.date]);

  const totalQ = record.assignedQuestionIndices.length;
  const completedCount = record.questionCompletions.filter(Boolean).length;
  const isCurrentDone = record.questionCompletions[qIdx];
  const globalIdx = record.assignedQuestionIndices[qIdx];
  const qText = questions[globalIdx] || "Loading question...";

  return (
    <div className="space-y-3">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status */}
        <div
          className={`flex-1 flex items-center justify-between rounded-lg border px-4 py-2.5 ${
            record.isCompleted
              ? "border-success/15 bg-success-bg text-success"
              : "border-warning/15 bg-warning-bg text-warning"
          }`}
        >
          <div className="flex items-center gap-2 text-[13px] font-medium">
            {record.isCompleted ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Completed
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {completedCount}/{totalQ} Done
              </>
            )}
          </div>
          {record.isCompleted && record.completionTime && (
            <span className="text-[11px] opacity-70">{formatDateTime(record.completionTime)}</span>
          )}
        </div>

        {/* Score */}
        {record.dailyScore > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-border-color bg-bg-secondary px-4 py-2.5 min-w-[140px]">
            <span className="text-[13px] text-text-secondary">Score</span>
            <span className="text-lg font-bold text-accent">{record.dailyScore}<span className="text-text-muted font-normal text-[12px]">/100</span></span>
          </div>
        )}
      </div>

      {/* One-at-a-time Question Viewer */}
      <div className="rounded-xl border border-border-color bg-bg-secondary overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-color">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-accent uppercase tracking-wider">Question {qIdx + 1}</span>
            {isCurrentDone && (
              <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">✓</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setQIdx(Math.max(0, qIdx - 1))}
              disabled={qIdx === 0}
              className="rounded p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[12px] text-text-secondary tabular-nums px-1">
              {qIdx + 1} / {totalQ}
            </span>
            <button
              onClick={() => setQIdx(Math.min(totalQ - 1, qIdx + 1))}
              disabled={qIdx === totalQ - 1}
              className="rounded p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
            </button>
          </div>
        </div>
        
        <div className="p-5">
          <p className="text-[14px] text-text-primary leading-relaxed">{qText}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: History ───────────────────────────────────────── */

function HistoryTab({ records }: { records: TeamDailyRecord[] }) {
  const [tasks, setTasks] = useState<Record<string, string[]>>({});
  const [holidays, setHolidays] = useState<string[]>([]);

  useEffect(() => {
    import("@/lib/firestore").then(({ getAllDailyTasks, getCustomHolidays }) => {
      getAllDailyTasks().then((allTasks) => {
        const map: Record<string, string[]> = {};
        allTasks.forEach(t => map[t.id] = t.allQuestions);
        setTasks(map);
      });
      getCustomHolidays().then(setHolidays);
    });
  }, []);

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-border-color bg-bg-secondary p-10 text-center">
        <p className="text-[13px] text-text-muted">No history available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((record) => {
        const isSunday = new Date(record.date + "T00:00:00Z").getUTCDay() === 0;
        const isHoliday = isSunday || holidays.includes(record.date);
        
        if (isHoliday) {
          return (
            <div key={record.id} className="rounded-lg border border-success/15 bg-success-bg/50 px-4 py-3 flex items-center justify-between">
              <span className="text-[13px] font-medium text-text-primary">
                <span className="text-text-muted font-normal mr-1">Day {getCompetitionDay(record.date)} ·</span>
                {record.date}
              </span>
              <span className="text-[12px] font-semibold text-success">Holiday 🎉</span>
            </div>
          );
        }

        const questions = tasks[record.date] || [];
        return (
          <details key={record.id} className="group rounded-lg border border-border-color bg-bg-secondary overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-bg-tertiary/40 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-text-primary">
                  <span className="text-text-muted font-normal mr-1">Day {getCompetitionDay(record.date)} ·</span>
                  {record.date}
                </span>
                <span
                  className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    record.isCompleted ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                  }`}
                >
                  {record.isCompleted ? "Done" : "Pending"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-accent">{record.dailyScore}<span className="text-text-muted font-normal text-[11px]">/100</span></span>
                <svg
                  className="h-3.5 w-3.5 text-text-muted transition-transform group-open:rotate-180"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </summary>
            <div className="border-t border-border-subtle px-4 py-3">
              {record.isCompleted && record.completionTime && record.assignedQuestionIndices && record.assignedQuestionIndices.length > 0 && (
                <p className="mb-2 text-[11px] text-text-muted">
                  Completed: {formatDateTime(record.completionTime)}
                </p>
              )}
              {record.assignedQuestionIndices && record.assignedQuestionIndices.length === 0 && (
                <p className="text-[12px] text-text-muted italic">Score uploaded directly from seeding. No individual tasks available.</p>
              )}
              <div className="space-y-2 mt-2">
                {record.assignedQuestionIndices && record.assignedQuestionIndices.map((globalIdx, i) => {
                  const isDone = record.questionCompletions[i];
                  const qText = questions[globalIdx] || "Loading...";
                  return (
                    <div key={i} className="flex gap-2 text-[13px] text-text-secondary items-start">
                      <span className={`text-[10px] font-semibold rounded w-4 text-center shrink-0 mt-0.5 ${isDone ? "text-success bg-success/10" : "text-text-muted"}`}>
                        {isDone ? "✓" : (i + 1)}
                      </span>
                      <span className={isDone ? "" : ""}>{qText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}

/* ─── Tab: Statistics ────────────────────────────────────── */

function StatsTab({
  team, todayRank, overallRank, todayRecord, totalDays,
}: {
  team: Team;
  todayRank: number | string;
  overallRank: number | string;
  todayRecord: TeamDailyRecord | null;
  totalDays: number;
}) {
  const stats = [
    { label: "Overall Rank", value: `#${overallRank}`, highlight: true },
    { label: "Today's Rank", value: todayRank === "—" ? "—" : `#${todayRank}`, highlight: false },
    { label: "Total Score", value: team.totalScore, highlight: true },
    { label: "Today's Score", value: todayRecord ? `${todayRecord.dailyScore}/100` : "—", highlight: false },
    { label: "Days Active", value: totalDays, highlight: false },
    { label: "Members", value: team.members.length, highlight: false },
  ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border-color bg-bg-secondary p-3.5">
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium">{s.label}</div>
            <div className={`text-xl font-bold mt-1 ${s.highlight ? "text-accent" : "text-text-primary"}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border-color bg-bg-secondary overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border-color">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Members</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {team.members.map((m, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-tertiary text-[10px] font-bold text-text-muted">
                {m.charAt(0)}
              </div>
              <span className="text-[13px] text-text-primary">{m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Leaderboard ───────────────────────────────────── */

function LeaderboardTab({ entries, currentTeamId }: { entries: LeaderboardEntry[]; currentTeamId: string }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border-color bg-bg-secondary p-10 text-center">
        <p className="text-[13px] text-text-muted">No scores recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-color bg-bg-secondary overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-color">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted w-14">#</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Team</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted w-20">Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.teamId}
              className={`border-b border-border-subtle last:border-b-0 ${
                entry.teamId === currentTeamId ? "bg-accent-glow" : ""
              }`}
            >
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <RankBadge rank={entry.rank} />
                  <RankChangeIndicator change={entry.rankChange} />
                </div>
              </td>
              <td className="px-4 py-2.5">
                <span className={`text-[13px] font-medium ${entry.teamId === currentTeamId ? "text-accent" : "text-text-primary"}`}>
                  {entry.teamName}
                  {entry.teamId === currentTeamId && <span className="ml-1.5 text-[10px] text-accent/60">you</span>}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className="text-[13px] font-semibold tabular-nums text-text-primary">{entry.totalScore}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const colors = ["text-gold", "text-silver", "text-bronze"];
    const icons = ["🥇", "🥈", "🥉"];
    return <span className={`text-sm ${colors[rank - 1]}`}>{icons[rank - 1]}</span>;
  }
  return <span className="text-[12px] tabular-nums text-text-muted">{rank}</span>;
}

function RankChangeIndicator({ change }: { change?: number }) {
  if (!change || change === 0) return null;
  if (change > 0) {
    return <span className="text-[10px] text-success font-semibold tracking-tighter" title="Rank up">▲{change}</span>;
  }
  return <span className="text-[10px] text-danger font-semibold tracking-tighter" title="Rank down">▼{Math.abs(change)}</span>;
}
