"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTeams } from "@/lib/firestore";
import type { Team } from "@/lib/types";

export default function HomePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = teams.filter(
    (t) =>
      t.teamName.toLowerCase().includes(search.toLowerCase()) ||
      String(t.teamNumber).includes(search)
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      {/* Hero Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px flex-1 bg-border-color" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-muted">
            Competition Dashboard
          </span>
          <div className="h-px flex-1 bg-border-color" />
        </div>
        <h1 className="text-center text-[2.25rem] font-extrabold tracking-tight leading-none">
          ESRC <span className="text-accent">2026</span>
        </h1>
        <p className="mt-2.5 text-center text-[13px] text-text-muted max-w-md mx-auto leading-relaxed">
          Select your team to view assigned tasks, daily rankings, and the live leaderboard.
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto mb-8 max-w-xs">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border-color bg-bg-secondary py-2 pl-9 pr-3 text-[13px] text-text-primary placeholder-text-muted outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent-glow transition-all"
            id="team-search"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-24">
          <div className="h-5 w-5 rounded-full border-[1.5px] border-border-color border-t-accent animate-spin" />
        </div>
      )}

      {/* Team Grid */}
      {!loading && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {filtered.map((team) => (
            <Link
              key={team.id}
              href={`/team/${team.id}`}
              prefetch={false}
              id={`team-card-${team.id}`}
              className="group relative flex items-center gap-3 rounded-lg border border-border-color bg-bg-secondary p-3.5 hover:border-accent/30 hover:bg-accent-glow transition-all shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-tertiary text-[13px] font-bold text-text-muted group-hover:bg-accent group-hover:text-white transition-colors">
                {team.teamNumber}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-text-primary truncate leading-tight">
                  {team.teamName}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {team.members.length} members
                </div>
              </div>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/0 group-hover:text-text-muted transition-colors"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center text-[13px] text-text-muted">
              No teams found matching &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
