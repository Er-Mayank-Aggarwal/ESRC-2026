"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getTeams, getDailyTask, getAllRecordsForDate, getEventMode, setEventMode as saveEventMode } from "@/lib/firestore";
import type { Team, TeamDailyRecord, EventMode } from "@/lib/types";
import LeaderboardPage from "../leaderboard/page";
import { getTodayDateIST } from "@/lib/utils";
import InstallToast from "@/components/InstallToast";

export default function AdminDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [todayRecords, setTodayRecords] = useState<TeamDailyRecord[]>([]);
  const [hasTasksToday, setHasTasksToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPortal, setShowPortal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Event Mode state
  const [eventMode, setEventMode] = useState<EventMode>({ mode: "off" });
  const [compName, setCompName] = useState("");
  const [savingMode, setSavingMode] = useState(false);

  const handleIframeLoad = () => {
    try {
      const iframeDoc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
      if (iframeDoc) {
        const links = iframeDoc.querySelectorAll('a[target="_blank"]');
        links.forEach(link => {
          link.setAttribute('target', '_self');
        });
      }
    } catch (e) {
      // Ignore cross-origin errors if they ever occur
    }
  };

  useEffect(() => {
    const today = getTodayDateIST();
    Promise.all([getTeams(), getDailyTask(today), getAllRecordsForDate(today), getEventMode()])
      .then(([t, dt, r, em]) => {
        setTeams(t);
        setHasTasksToday(!!dt);
        setTodayRecords(r);
        setEventMode(em);
        setCompName(em.competitionName || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSetMode(mode: "off" | "viva" | "competition") {
    setSavingMode(true);
    const newMode: EventMode = { mode };
    if (mode === "competition") {
      newMode.competitionName = compName || "Competition";
    }
    await saveEventMode(newMode);
    setEventMode(newMode);
    setSavingMode(false);
  }

  async function handleSaveCompName() {
    if (eventMode.mode !== "competition") return;
    setSavingMode(true);
    const newMode: EventMode = { mode: "competition", competitionName: compName || "Competition" };
    await saveEventMode(newMode);
    setEventMode(newMode);
    setSavingMode(false);
  }

  const completedCount = todayRecords.filter((r) => r.isCompleted).length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-border-color border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <InstallToast title="Install Admin App" hideIconOnDismiss={true} />

      {/* Event Mode Control */}
      <div className="rounded-xl border border-border-color bg-bg-secondary p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[13px] font-semibold text-text-primary">Event Mode</h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              {eventMode.mode === "off"
                ? "Normal day — no leaderboard or scores visible to teams"
                : eventMode.mode === "viva"
                  ? "Viva day — leaderboard and scores are live"
                  : `${eventMode.competitionName || "Competition"} — leaderboard and scores are live`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1 rounded-lg border border-border-color bg-bg-primary p-1">
              {(["off", "viva", "competition"] as const).map((m) => {
                const labels = { off: "Off", viva: "Viva", competition: "Competition" };
                const isActive = eventMode.mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => handleSetMode(m)}
                    disabled={savingMode}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                      isActive
                        ? m === "off"
                          ? "bg-bg-tertiary text-text-primary shadow-sm"
                          : "bg-accent text-white shadow-sm"
                        : "text-text-muted hover:text-text-secondary"
                    } disabled:opacity-50`}
                  >
                    {labels[m]}
                  </button>
                );
              })}
            </div>

            {eventMode.mode === "competition" && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="Event name..."
                  className="rounded-lg border border-border-color bg-bg-primary py-1.5 px-3 text-[12px] text-text-primary outline-none focus:border-accent w-40"
                />
                <button
                  onClick={handleSaveCompName}
                  disabled={savingMode}
                  className="rounded-md px-2.5 py-1.5 text-[11px] font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
        <button
          onClick={() => setShowPortal(true)}
          className="rounded-xl border border-border-color bg-bg-secondary p-4 text-left hover:border-accent/40 hover:shadow-[var(--card-shadow-hover)] transition-all"
        >
          <div className="text-xs text-text-muted mb-1">External</div>
          <div className="text-xl font-bold text-text-primary">Portal</div>
        </button>
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

      {showPortal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-bg-primary rounded-2xl shadow-2xl border border-border-color flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-color bg-bg-secondary">
              <h2 className="text-sm font-bold text-text-primary">ESRC Portal</h2>
              <button
                onClick={() => setShowPortal(false)}
                className="rounded-full p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="flex-1 bg-bg-primary">
              <iframe 
                ref={iframeRef}
                onLoad={handleIframeLoad}
                src="/esrc26/" 
                className="w-full h-full border-none"
                title="ESRC Portal"
              />
            </div>
          </div>
        </div>
      )}
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

