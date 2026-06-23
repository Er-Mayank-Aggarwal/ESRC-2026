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
  updateQuestionRemark,
} from "@/lib/firestore";
import type { Team, DailyTask, TeamDailyRecord, QuestionRemark } from "@/lib/types";
import { getTodayDateIST } from "@/lib/utils";

function getTodayDate(): string {
  return getTodayDateIST();
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", { timeStyle: "short", dateStyle: "medium" });
}

const REMARK_OPTIONS: { value: QuestionRemark; label: string; color: string; activeColor: string }[] = [
  { value: "excellent", label: "Excellent", color: "text-text-muted hover:text-success hover:bg-success-bg", activeColor: "bg-success-bg text-success border-success/20" },
  { value: "good", label: "Good", color: "text-text-muted hover:text-accent hover:bg-accent-glow", activeColor: "bg-accent-glow text-accent border-accent/20" },
  { value: "needs-work", label: "Needs Work", color: "text-text-muted hover:text-warning hover:bg-warning-bg", activeColor: "bg-warning-bg text-warning border-warning/20" },
];

export default function TeamsProgressPage() {
  const [date, setDate] = useState(getTodayDate());
  const [teams, setTeams] = useState<Team[]>([]);
  const [task, setTask] = useState<DailyTask | null>(null);
  const [records, setRecords] = useState<TeamDailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [savingScore, setSavingScore] = useState<Record<string, boolean>>({});
  const [editingScore, setEditingScore] = useState<Record<string, boolean>>({});
  const [teamQIdx, setTeamQIdx] = useState<Record<string, number>>({});
  const [savingRemark, setSavingRemark] = useState<Record<string, boolean>>({});

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

  // Day-wise: check if THIS day's task is an event day
  const isEventDay = task?.isEventDay === true;
  const getRecord = (teamId: string) => records.find((r) => r.teamId === teamId);

  // Helper to update a single record in state without full reload
  function updateRecordInState(teamId: string, updater: (rec: TeamDailyRecord) => TeamDailyRecord) {
    setRecords(prev => prev.map(r => r.teamId === teamId ? updater({ ...r }) : r));
  }

  async function handleToggleQuestion(teamId: string, qLocalIdx: number) {
    // Optimistic update
    updateRecordInState(teamId, (rec) => {
      const newCompletions = [...rec.questionCompletions];
      newCompletions[qLocalIdx] = !newCompletions[qLocalIdx];
      const allDone = newCompletions.every(Boolean);
      return {
        ...rec,
        questionCompletions: newCompletions,
        isCompleted: allDone,
        completionTime: allDone ? new Date().toISOString() : rec.completionTime,
      };
    });
    await toggleQuestionCompletion(teamId, date, qLocalIdx);
  }

  async function handleToggleAll(teamId: string) {
    const record = getRecord(teamId);
    if (!record) return;
    const wasCompleted = record.isCompleted;
    // Optimistic update
    updateRecordInState(teamId, (rec) => ({
      ...rec,
      questionCompletions: rec.questionCompletions.map(() => !wasCompleted),
      isCompleted: !wasCompleted,
      completionTime: !wasCompleted ? new Date().toISOString() : null,
    }));
    if (wasCompleted) {
      await markTaskIncomplete(teamId, date);
    } else {
      await markTaskComplete(teamId, date);
    }
  }

  async function handleSaveScore(teamId: string) {
    const val = scores[teamId] || "0";
    setSavingScore((p) => ({ ...p, [teamId]: true }));
    await updateDailyScore(teamId, date, val);
    // Update score in local state
    const numScore = parseInt(val) || 0;
    updateRecordInState(teamId, (rec) => ({ ...rec, dailyScore: numScore }));
    setSavingScore((p) => ({ ...p, [teamId]: false }));
    setEditingScore((p) => ({ ...p, [teamId]: false }));
  }

  async function handleSetRemark(teamId: string, qLocalIdx: number, remark: QuestionRemark) {
    const key = `${teamId}_${qLocalIdx}`;
    setSavingRemark((p) => ({ ...p, [key]: true }));
    // Optimistic update
    updateRecordInState(teamId, (rec) => {
      const newRemarks = [...(rec.questionRemarks || Array(rec.questionCompletions.length).fill(null))];
      newRemarks[qLocalIdx] = remark;
      return { ...rec, questionRemarks: newRemarks };
    });
    await updateQuestionRemark(teamId, date, qLocalIdx, remark);
    setSavingRemark((p) => ({ ...p, [key]: false }));
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
          <p className="text-[12px] text-text-muted mt-0.5">
            {isEventDay ? "Mark questions complete and assign scores." : "Mark questions complete and give remarks."}
          </p>
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
          <p className="text-[12px] text-text-muted mt-0.5">
            {isEventDay ? "Mark questions complete and assign scores." : "Mark questions complete and give remarks."}
          </p>
        </div>
        <div>
          <label htmlFor="p-date2" className="block text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Date</label>
          <input id="p-date2" type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border-color bg-bg-secondary py-1.5 px-3 text-[13px] text-text-primary outline-none focus:border-accent" />
        </div>
      </div>

      {/* Mode indicator */}
      {!isEventDay && (
        <div className="rounded-lg border border-border-color bg-bg-secondary px-4 py-2.5 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Mode:</span>
          <span className="text-[12px] font-medium text-text-secondary">Normal Day — Remarks Only</span>
        </div>
      )}

      <div className="space-y-2.5">
        {teams.map((team) => {
          const record = getRecord(team.id);
          if (!record) return null;

          const completedCount = record.questionCompletions.filter(Boolean).length;
          const totalQ = record.assignedQuestionIndices.length;
          const qIdx = teamQIdx[team.id] ?? 0;
          const currentRemark = record.questionRemarks?.[qIdx] || null;
          const remarkKey = `${team.id}_${qIdx}`;

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

                  {/* Score — only on event days */}
                  {isEventDay && (
                    <>
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
                            {record.dailyScore}
                          </span>
                          <button
                            onClick={() => setEditingScore((p) => ({ ...p, [team.id]: true }))}
                            className="rounded px-2 py-1 text-[11px] font-medium bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
                          >
                            Edit Score
                          </button>
                        </div>
                      )}
                    </>
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

                {/* Remark buttons — only on normal days */}
                {!isEventDay && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border-subtle">
                    <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider mr-1">Remark:</span>
                    {REMARK_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSetRemark(team.id, qIdx, currentRemark === opt.value ? null : opt.value)}
                        disabled={savingRemark[remarkKey]}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium border transition-all disabled:opacity-50 ${
                          currentRemark === opt.value
                            ? opt.activeColor
                            : `border-border-color ${opt.color}`
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
