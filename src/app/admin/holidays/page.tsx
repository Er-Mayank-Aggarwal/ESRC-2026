"use client";

import { useState, useEffect } from "react";
import { getCustomHolidays, addCustomHoliday, removeCustomHoliday } from "@/lib/firestore";

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    loadHolidays();
  }, []);

  async function loadHolidays() {
    setLoading(true);
    const h = await getCustomHolidays();
    setHolidays(h.sort((a, b) => b.localeCompare(a)));
    setLoading(false);
  }

  async function handleAdd() {
    if (!newDate) return;
    await addCustomHoliday(newDate);
    setNewDate("");
    await loadHolidays();
  }

  async function handleRemove(date: string) {
    await removeCustomHoliday(date);
    await loadHolidays();
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
        <h2 className="text-lg font-bold text-text-primary">Manage Holidays</h2>
        <p className="text-[12px] text-text-muted mt-0.5">
          Sundays are automatic holidays. Add custom holidays here (no questions/scores for these days).
        </p>
      </div>

      <div className="flex items-end gap-3 rounded-xl border border-border-color bg-bg-secondary p-5">
        <div>
          <label htmlFor="h-date" className="block text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">Date</label>
          <input
            id="h-date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded-lg border border-border-color bg-bg-primary py-1.5 px-3 text-[13px] text-text-primary outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newDate}
          className="rounded-lg bg-accent px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          Add Holiday
        </button>
      </div>

      <div className="rounded-lg border border-border-color bg-bg-secondary overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border-color">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Custom Holidays</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {holidays.length === 0 ? (
            <div className="px-4 py-5 text-center text-[13px] text-text-muted">
              No custom holidays added yet.
            </div>
          ) : (
            holidays.map((h) => (
              <div key={h} className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] font-medium text-text-primary">{new Date(h).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <button
                  onClick={() => handleRemove(h)}
                  className="rounded px-2.5 py-1 text-[11px] font-medium text-danger hover:bg-danger/10 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
