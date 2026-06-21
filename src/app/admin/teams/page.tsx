"use client";

import { useState, useEffect } from "react";
import {
  getTeams,
  getDailyTask,
  getAllRecordsForDate,
  toggleQuestionCompletion,
  markTaskComplete,
  markTaskIncomplete,
  updateDailyScore,
} from "@/lib/firestore";
import type { Team, DailyTask, TeamDailyRecord } from "@/lib/types";
import { getTodayDateIST } from "@/lib/utils";

function getTodayDate(): string {
  return getTodayDateIST();
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", { timeStyle: "short", dateStyle: "medium" });
}

export default function TeamsProgressPage() {
  const [date, setDate] = useState(getTodayDate());
  const [teams, setTeams] = useState<Team[]>([]);
  const [task, setTask] = useState<DailyTask | null>(null);
  const [records, setRecords] = useState<TeamDailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [savingScore, setSavingScore] = useState<Record<string, boolean>>({});
  const [editingScore, setEditingScore] = useState<Record<string, boolean>>({});
  // Track which question each team card is showing
  const [teamQIdx, setTeamQIdx] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData(date);
  }, [date]);

  async function loadData(d: string) {
    setLoading(true);
    const [t, dt, r] = await Promise.all([getTeams(), getDailyTask(d), getAllRecordsForDate(d)]);
    setTeams(t);
    setTask(dt);
    setRecords(r);
    const s: Record<string, string> = {};
    r.forEach((rec) => (s[rec.teamId] = String(rec.dailyScore)));
    setScores(s);
    setTeamQIdx({});
    setLoading(false);
  }

  const getRecord = (teamId: string) => records.find((r) => r.teamId === teamId);

  async function handleToggleQuestion(teamId: string, qLocalIdx: number) {
    await toggleQuestionCompletion(teamId, date, qLocalIdx);
    await loadData(date);
  }

  async function handleToggleAll(teamId: string) {
    const record = getRecord(teamId);
    if (!record) return;
    if (record.isCompleted) {
      await markTaskIncomplete(teamId, date);
    } else {
      await markTaskComplete(teamId, date);
    }
    await loadData(date);
  }

  async function handleSaveScore(teamId: string) {
    const val = scores[teamId] || "0";
    setSavingScore((p) => ({ ...p, [teamId]: true }));
    await updateDailyScore(teamId, date, val);
    await loadData(date);
    setSavingScore((p) => ({ ...p, [teamId]: false }));
    setEditingScore((p) => ({ ...p, [teamId]: false }));
  }

  function getQuestionText(record: TeamDailyRecord, localIdx: number): string {
    if (!task) return "";
    const globalIdx = record.assignedQuestionIndices[localIdx];
    return task.allQuestions[globalIdx] ?? "[Deleted]";
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-5 w-5 rounded-full border-[1.5px] border-border-color border-t-accent animate-spin" />
      </div>
    );
  }

  if (!task || records.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Team Progress</h2>
          <p className="text-[12px] text-text-muted mt-0.5">Mark questions complete and assign scores.</p>
        </div>
        <div>
          <label htmlFor="p-date" className="block text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Date</label>
          <input id="p-date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border-color bg-bg-secondary py-1.5 px-3 text-[13px] text-text-primary outline-none focus:border-accent" />
        </div>
        <div className="rounded-xl border border-border-color bg-bg-secondary p-10 text-center text-[13px] text-text-muted">
          No tasks distributed for {date}. Go to Questions page first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Team Progress</h2>
          <p className="text-[12px] text-text-muted mt-0.5">Mark questions complete and assign scores.</p>
        </div>
        <div>
          <label htmlFor="p-date2" className="block text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Date</label>
          <input id="p-date2" type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border-color bg-bg-secondary py-1.5 px-3 text-[13px] text-text-primary outline-none focus:border-accent" />
        </div>
      </div>

      <div className="space-y-2.5">
        {teams.map((team) => {
          const record = getRecord(team.id);
          if (!record) return null;

          const completedCount = record.questionCompletions.filter(Boolean).length;
          const totalQ = record.assignedQuestionIndices.length;
          const qIdx = teamQIdx[team.id] ?? 0;

          return (
            <div key={team.id} className="rounded-xl border border-border-color bg-bg-secondary overflow-hidden">
              {/* Team Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-border-color">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-bg-tertiary text-[12px] font-bold text-text-muted">
                    {team.teamNumber}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-text-primary">{team.teamName}</div>
                    <div className="text-[11px] text-text-muted">
                      {completedCount}/{totalQ} questions done
                      {record.isCompleted && record.completionTime && (
                        <span className="ml-1.5 text-success">· {formatTime(record.completionTime)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* All done toggle */}
                  <button
                    onClick={() => handleToggleAll(team.id)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                      record.isCompleted
                        ? "bg-success-bg text-success border-success/15"
                        : "bg-bg-tertiary text-text-muted border-border-color hover:border-success/30 hover:text-success"
                    }`}
                  >
                    {record.isCompleted ? "✓ All Done" : "Mark All Done"}
                  </button>

                  {/* Score */}
                  {editingScore[team.id] ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={scores[team.id] ?? "0"}
                        onChange={(e) => setScores((p) => ({ ...p, [team.id]: e.target.value }))}
                        className="w-14 rounded border border-border-color bg-bg-primary py-1 px-2 text-[13px] text-text-primary text-center outline-none focus:border-accent"
                        autoFocus
                      />
                      <span className="text-[11px] text-text-muted">/100</span>
                      <button
                        onClick={() => handleSaveScore(team.id)}
                        disabled={savingScore[team.id]}
                        className="rounded px-2 py-1 text-[11px] font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
                      >
                        {savingScore[team.id] ? "..." : "Save"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-text-primary">
                        {record.dailyScore}<span className="text-[11px] text-text-muted font-normal">/100</span>
                      </span>
                      <button
                        onClick={() => setEditingScore((p) => ({ ...p, [team.id]: true }))}
                        className="rounded px-2 py-1 text-[11px] font-medium bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                      >
                        Edit Score
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Question viewer — one at a time */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Q{qIdx + 1}</span>
                    <button
                      onClick={() => handleToggleQuestion(team.id, qIdx)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                        record.questionCompletions[qIdx]
                          ? "bg-success-bg text-success"
                          : "bg-bg-tertiary text-text-muted hover:text-warning"
                      }`}
                    >
                      {record.questionCompletions[qIdx] ? "✓ Done" : "Pending"}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTeamQIdx((p) => ({ ...p, [team.id]: Math.max(0, qIdx - 1) }))}
                      disabled={qIdx === 0}
                      className="rounded p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <span className="text-[11px] text-text-muted tabular-nums">{qIdx + 1}/{totalQ}</span>
                    <button
                      onClick={() => setTeamQIdx((p) => ({ ...p, [team.id]: Math.min(totalQ - 1, qIdx + 1) }))}
                      disabled={qIdx === totalQ - 1}
                      className="rounded p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
                    </button>
                  </div>
                </div>

                <p className="text-[13px] text-text-primary leading-relaxed">{getQuestionText(record, qIdx)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
