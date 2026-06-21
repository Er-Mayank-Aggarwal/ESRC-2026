"use client";

import { useState, useEffect } from "react";
import { getTeams, updateTeam } from "@/lib/firestore";
import type { Team } from "@/lib/types";

export default function ManageTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMembers, setEditMembers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    setLoading(true);
    const t = await getTeams();
    setTeams(t);
    setLoading(false);
  }

  function startEdit(team: Team) {
    setEditingId(team.id);
    setEditName(team.teamName);
    setEditMembers([...team.members]);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditMembers([]);
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    await updateTeam(editingId, { teamName: editName, members: editMembers });
    await loadTeams();
    setEditingId(null);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-5 w-5 rounded-full border-[1.5px] border-border-color border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Manage Teams</h2>
        <p className="text-[12px] text-text-muted mt-0.5">View and edit team names and members.</p>
      </div>

      <div className="rounded-lg border border-border-color bg-bg-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-color">
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted w-10">#</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted min-w-[120px]">Name</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">M1</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">M2</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">M3</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">M4</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">M5</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const isEditing = editingId === team.id;
                return (
                  <tr key={team.id} className={`border-b border-border-subtle last:border-b-0 ${isEditing ? "bg-accent-glow" : ""}`}>
                    <td className="px-3 py-2 text-text-muted font-medium">{team.teamNumber}</td>

                    {isEditing ? (
                      <>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded border border-border-color bg-bg-primary px-2 py-1 text-[13px] text-text-primary outline-none focus:border-accent"
                          />
                        </td>
                        {[0, 1, 2, 3, 4].map((mi) => (
                          <td key={mi} className="px-3 py-1.5">
                            <input
                              type="text"
                              value={editMembers[mi] || ""}
                              onChange={(e) => {
                                const m = [...editMembers];
                                m[mi] = e.target.value;
                                setEditMembers(m);
                              }}
                              className="w-full rounded border border-border-color bg-bg-primary px-2 py-1 text-[13px] text-text-primary outline-none focus:border-accent min-w-[100px]"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="rounded px-2 py-1 text-[11px] font-medium bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
                            >
                              {saving ? "..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded px-2 py-1 text-[11px] font-medium text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 font-medium text-text-primary">{team.teamName}</td>
                        {[0, 1, 2, 3, 4].map((mi) => (
                          <td key={mi} className="px-3 py-2 text-text-secondary">{team.members[mi] || "—"}</td>
                        ))}
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => startEdit(team)}
                            className="rounded px-2 py-1 text-[11px] font-medium text-text-muted hover:text-accent hover:bg-accent-glow transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
