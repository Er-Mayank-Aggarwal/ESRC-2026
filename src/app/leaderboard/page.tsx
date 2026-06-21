"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLeaderboard, getDailyLeaderboard, checkIsHoliday } from "@/lib/firestore";
import type { LeaderboardEntry } from "@/lib/types";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

type TabType = "overall" | "daily";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("overall");
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [isHoliday, setIsHoliday] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (tab === "overall") {
      setIsHoliday(false);
      getLeaderboard()
        .then(setEntries)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      checkIsHoliday(selectedDate).then(holiday => {
        setIsHoliday(holiday);
        if (holiday) {
          setEntries([]);
          setLoading(false);
        } else {
          getDailyLeaderboard(selectedDate)
            .then(setEntries)
            .catch(console.error)
            .finally(() => setLoading(false));
        }
      });
    }
  }, [tab, selectedDate]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-[12px] text-text-muted">
            {tab === "overall" ? "Overall rankings based on cumulative scores" : "Rankings based on scores for a specific day"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end gap-3">
          {tab === "daily" && (
            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-border-color bg-bg-secondary py-1.5 px-3 text-[12px] text-text-primary outline-none focus:border-accent"
              />
            </div>
          )}
          <div className="flex gap-1 rounded-lg border border-border-color bg-bg-secondary p-1">
            <button
              onClick={() => setTab("daily")}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                tab === "daily" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Daily
            </button>
          <button
            onClick={() => setTab("overall")}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all ${
              tab === "overall" ? "bg-bg-primary text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Overall
          </button>
        </div>
      </div>
    </div>

      {loading && (
        <div className="flex justify-center py-24">
          <div className="h-5 w-5 rounded-full border-[1.5px] border-border-color border-t-accent animate-spin" />
        </div>
      )}

      {!loading && entries.length > 0 && (
        <>
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[entries[1], entries[0], entries[2]].map((entry, i) => {
              if (!entry) return null;
              const podiumOrder = [2, 1, 3];
              const rank = podiumOrder[i];
              const colors = {
                1: "border-gold/20 bg-gold/[0.04]",
                2: "border-silver/20 bg-silver/[0.04]",
                3: "border-bronze/20 bg-bronze/[0.04]",
              };
              const textColors = { 1: "text-gold", 2: "text-silver", 3: "text-bronze" };
              const icons = { 1: "🥇", 2: "🥈", 3: "🥉" };
              const heights = { 1: "pt-6", 2: "pt-8", 3: "pt-8" };

              return (
                <Link
                  key={entry.teamId}
                  href={`/team/${entry.teamId}`}
                  className={`rounded-xl border ${colors[rank as 1|2|3]} ${heights[rank as 1|2|3]} pb-4 px-3 text-center hover:shadow-[var(--card-shadow-hover)] transition-all`}
                >
                  <div className="text-2xl mb-1">{icons[rank as 1|2|3]}</div>
                  <div className={`text-[13px] font-bold ${textColors[rank as 1|2|3]} flex justify-center items-center gap-1`}>
                    {entry.teamName}
                    {tab === "overall" && <RankChangeIndicator change={entry.rankChange} />}
                  </div>
                  <div className="text-lg font-bold text-text-primary mt-0.5">{entry.totalScore}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">points</div>
                </Link>
              );
            })}
          </div>

          {/* Rest of the table */}
          <div className="rounded-lg border border-border-color bg-bg-secondary overflow-hidden">
            <table className="w-full" id="leaderboard-table">
              <thead>
                <tr className="border-b border-border-color">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted w-14">#</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Team</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted w-20">Score</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(3).map((entry) => (
                  <tr
                    key={entry.teamId}
                    className="border-b border-border-subtle last:border-b-0 hover:bg-bg-tertiary/30 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] tabular-nums text-text-muted">{entry.rank}</span>
                        {tab === "overall" && <RankChangeIndicator change={entry.rankChange} />}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/team/${entry.teamId}`} className="text-[13px] font-medium text-text-primary hover:text-accent transition-colors">
                        {entry.teamName}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-[13px] font-semibold tabular-nums text-text-primary">{entry.totalScore}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && entries.length === 0 && !isHoliday && (
        <div className="rounded-xl border border-border-color bg-bg-secondary p-10 text-center">
          <p className="text-[13px] text-text-muted">No scores recorded yet.</p>
        </div>
      )}

      {!loading && isHoliday && tab === "daily" && (
        <div className="rounded-xl border border-success/15 bg-success-bg p-10 text-center mt-4">
          <p className="text-[14px] font-semibold text-success mb-1">It&apos;s a Holiday! 🎉</p>
          <p className="text-[13px] text-success/80">Take a break today. No leaderboard is available for holidays.</p>
        </div>
      )}
    </div>
  );
}

function RankChangeIndicator({ change }: { change?: number }) {
  if (!change || change === 0) return null;
  if (change > 0) {
    return <span className="text-[10px] text-success font-semibold tracking-tighter" title="Rank up">▲{change}</span>;
  }
  return <span className="text-[10px] text-danger font-semibold tracking-tighter" title="Rank down">▼{Math.abs(change)}</span>;
}
