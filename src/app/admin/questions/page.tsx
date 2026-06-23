"use client";

import { useState, useEffect, useRef } from "react";
import {
  getDailyTask,
  getAllRecordsForDate,
  createDailyTask,
  distributeQuestions,
  updateQuestionText,
  addQuestionToDay,
  deleteQuestionFromDay,
  revokeDistribution,
  getTeams,
  updateTaskQuestionsPerTeam,
  getCompetitionDay,
} from "@/lib/firestore";
import type { DailyTask, TeamDailyRecord } from "@/lib/types";
import { jsPDF } from "jspdf";

function getTodayDate(): string {
  // IST is UTC+5:30
  const d = new Date();
  d.setMinutes(d.getMinutes() + 330);
  return d.toISOString().split("T")[0];
}

export default function QuestionsPage() {
  const [date, setDate] = useState(getTodayDate());
  const [existingTask, setExistingTask] = useState<DailyTask | null>(null);
  const [records, setRecords] = useState<TeamDailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // New question flow
  const [questionsPerTeam, setQuestionsPerTeam] = useState(4);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentDraft, setCurrentDraft] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [distributing, setDistributing] = useState(false);
  const [distributed, setDistributed] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [viewIdx, setViewIdx] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData(date);
  }, [date]);

  async function loadData(d: string) {
    setLoading(true);
    setMessage(null);
    const [task, recs] = await Promise.all([getDailyTask(d), getAllRecordsForDate(d)]);
    setExistingTask(task);
    setRecords(recs);
    setDistributed(recs.length > 0);
    if (task) {
      setQuestions(task.allQuestions);
      setQuestionsPerTeam(task.questionsPerTeam);
    } else {
      setQuestions([]);
      setQuestionsPerTeam(4);
    }
    setCurrentDraft("");
    setEditingIdx(null);
    setViewIdx(0);
    setLoading(false);
  }

  async function handleAddQuestion() {
    if (!currentDraft.trim()) return;
    const newQ = [...questions, currentDraft.trim()];
    setQuestions(newQ);
    setCurrentDraft("");

    if (existingTask) {
      await addQuestionToDay(date, currentDraft.trim());
      await loadData(date);
    }
  }

  async function handleSaveEdit() {
    if (editingIdx === null) return;
    const updated = [...questions];
    updated[editingIdx] = editText;
    setQuestions(updated);

    if (existingTask) {
      await updateQuestionText(date, editingIdx, editText);
      await loadData(date);
    }
    setEditingIdx(null);
    setEditText("");
  }

  async function handleDeleteQuestion() {
    if (!confirm("Are you sure you want to delete this question?")) return;

    if (!existingTask) {
      const updated = [...questions];
      updated.splice(viewIdx, 1);
      setQuestions(updated);
      setViewIdx(Math.max(0, viewIdx - 1));
      return;
    }

    await deleteQuestionFromDay(date, viewIdx);
    await loadData(date);
    setViewIdx(Math.max(0, viewIdx - 1));
  }

  async function handleDistribute() {
    if (questions.length < questionsPerTeam) {
      setMessage({ type: "error", text: `Need at least ${questionsPerTeam} questions. You have ${questions.length}.` });
      return;
    }

    setDistributing(true);
    setMessage(null);
    try {
      if (!existingTask) {
        await createDailyTask(date, questions, questionsPerTeam);
      } else if (existingTask.questionsPerTeam !== questionsPerTeam) {
        await updateTaskQuestionsPerTeam(date, questionsPerTeam);
      }
      await distributeQuestions(date);
      const teams = await getTeams();
      setMessage({ type: "success", text: `Distributed ${questionsPerTeam} questions to each of ${teams.length} teams.` });
      await loadData(date);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Distribution failed. Check console." });
    }
    setDistributing(false);
  }

  async function handleRevokeDistribution() {
    if (!confirm("Are you sure you want to revoke the distribution? This will wipe all team progress for today.")) return;
    setDistributing(true);
    setMessage(null);
    try {
      await revokeDistribution(date);
      setMessage({ type: "success", text: "Distribution revoked successfully." });
      await loadData(date);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to revoke distribution." });
    }
    setDistributing(false);
  }

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4"
      });

      const element = printRef.current;
      element.style.display = "block";

      const dayNumber = getCompetitionDay(date);

      await doc.html(element, {
        callback: function (pdf) {
          pdf.save(`Challange_Questions_Day${dayNumber}.pdf`);
          element.style.display = "none";
          setIsGeneratingPdf(false);
        },
        margin: [40, 40, 40, 40],
        autoPaging: "text",
        width: 515, // 595.28 (A4 width in pt) - 80 (margins)
        windowWidth: 800
      });
    } catch (e) {
      console.error(e);
      if (printRef.current) printRef.current.style.display = "none";
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-5 w-5 rounded-full border-[1.5px] border-border-color border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Questions Manager</h2>
          <p className="text-[12px] text-text-muted mt-0.5">Add questions one by one, then distribute to teams.</p>
        </div>
        {questions.length > 0 && (
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="rounded-lg bg-bg-tertiary border border-border-color px-4 py-2 text-[12px] font-medium text-text-primary hover:bg-bg-primary hover:border-accent hover:text-accent transition-colors flex items-center gap-2 flex-shrink-0 cursor-pointer disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            <span id="download-text">{isGeneratingPdf ? "Generating..." : "Download PDF"}</span>
          </button>
        )}
      </div>

      {/* Date + Per Team config */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="q-date" className="block text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Date</label>
          <input
            id="q-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border-color bg-bg-secondary py-1.5 px-3 text-[13px] text-text-primary outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="q-per-team" className="block text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Per Team</label>
          <input
            id="q-per-team"
            type="text"
            inputMode="numeric"
            value={questionsPerTeam}
            onChange={(e) => setQuestionsPerTeam(Number(e.target.value) || 0)}
            className="w-16 rounded-lg border border-border-color bg-bg-secondary py-1.5 px-3 text-[13px] text-text-primary text-center outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg px-4 py-2.5 text-[13px] font-medium border ${message.type === "success" ? "bg-success-bg text-success border-success/15" : "bg-danger-bg text-danger border-danger/15"
          }`}>
          {message.text}
        </div>
      )}

      {/* Existing Questions — one at a time viewer */}
      {questions.length > 0 && (
        <div className="rounded-xl border border-border-color bg-bg-secondary overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-color">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Questions · {questions.length} total
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewIdx(Math.max(0, viewIdx - 1))}
                disabled={viewIdx === 0}
                className="rounded p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <span className="text-[12px] text-text-secondary tabular-nums px-1">
                {viewIdx + 1} / {questions.length}
              </span>
              <button
                onClick={() => setViewIdx(Math.min(questions.length - 1, viewIdx + 1))}
                disabled={viewIdx === questions.length - 1}
                className="rounded p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Q{viewIdx + 1}</span>
              {editingIdx !== viewIdx && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingIdx(viewIdx); setEditText(questions[viewIdx]); }}
                    className="text-[11px] text-text-muted hover:text-accent transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteQuestion}
                    className="text-[11px] text-text-muted hover:text-danger transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {editingIdx === viewIdx ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-border-color bg-bg-primary py-2 px-3 text-[13px] text-text-primary outline-none focus:border-accent resize-y"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="rounded px-3 py-1.5 text-[12px] font-medium bg-accent text-white hover:bg-accent/90"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingIdx(null); setEditText(""); }}
                    className="rounded px-3 py-1.5 text-[12px] font-medium text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-text-primary leading-relaxed">{questions[viewIdx]}</p>
            )}
          </div>
        </div>
      )}

      {/* Add new question */}
      <div className="rounded-xl border border-border-color bg-bg-secondary p-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
          Add Question {questions.length + 1}
        </label>
        <textarea
          value={currentDraft}
          onChange={(e) => setCurrentDraft(e.target.value)}
          rows={4}
          placeholder="Type the full question here..."
          className="w-full rounded-lg border border-border-color bg-bg-primary py-2.5 px-3 text-[13px] text-text-primary placeholder-text-muted outline-none focus:border-accent resize-y mb-3"
        />
        <button
          onClick={handleAddQuestion}
          disabled={!currentDraft.trim()}
          className="rounded-lg bg-bg-tertiary border border-border-color px-4 py-2 text-[12px] font-medium text-text-primary hover:bg-accent hover:text-white hover:border-accent disabled:opacity-40 transition-colors"
        >
          Add Q{questions.length + 1}
        </button>
      </div>

      {/* Distribute / Revoke */}
      {!distributed && questions.length > 0 && (
        <button
          onClick={handleDistribute}
          disabled={distributing || questions.length < questionsPerTeam}
          className="rounded-lg bg-accent px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          id="distribute-btn"
        >
          {distributing ? "Distributing..." : `Distribute ${questionsPerTeam} Questions to Each Team`}
        </button>
      )}

      {distributed && (
        <div className="rounded-lg border border-success/15 bg-success-bg px-4 py-3 flex items-center justify-between">
          <span className="text-[13px] text-success font-medium">✓ Questions distributed to {records.length} teams</span>
          <button
            onClick={handleRevokeDistribution}
            disabled={distributing}
            className="text-[12px] font-medium text-danger hover:underline disabled:opacity-50"
          >
            {distributing ? "Revoking..." : "Revoke Distribution"}
          </button>
        </div>
      )}

      {/* Hidden print area for PDF Generation */}
      <div
        ref={printRef}
        style={{
          display: "none",
          width: "800px",
          background: "white",
          color: "black",
          padding: "30px",
          fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"
        }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "35px", borderBottom: "2px solid #eaeaea", paddingBottom: "12px" }}>
          Questions - Day {getCompetitionDay(date)}
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {questions.map((q, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", fontSize: "16px", lineHeight: "1.6", color: "#111" }}>
              <div style={{ fontWeight: "bold", color: "#000", fontSize: "17px", minWidth: "40px" }}>Q{i + 1}.</div>
              <div style={{ whiteSpace: "pre-wrap", flex: 1 }}>{q}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
