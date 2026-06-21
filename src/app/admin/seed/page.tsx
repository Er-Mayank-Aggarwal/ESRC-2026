"use client";

import { useState } from "react";
import { seedTeamsIfEmpty } from "@/lib/firestore";

export default function SeedPage() {
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSeed = async () => {
    setSeeding(true);
    setError("");
    setDone(false);
    try {
      await seedTeamsIfEmpty();
      setDone(true);
    } catch (err) {
      console.error(err);
      setError("Failed to seed. Check console and Firebase config.");
    }
    setSeeding(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Seed Database</h2>
        <p className="text-xs text-text-muted mt-1">
          Initialize the database with 32 dummy teams. Only do this once or when
          you want to reset.
        </p>
      </div>

      <div className="rounded-xl border border-border-color bg-bg-secondary p-6">
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 mb-4">
          <p className="text-sm text-yellow-500 font-medium">⚠️ Warning</p>
          <p className="text-xs text-text-muted mt-1">
            This will create/overwrite 32 team documents in Firestore. Existing
            team data (names, members) will be reset. Daily records and scores
            will NOT be affected.
          </p>
        </div>

        {done && (
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2.5 mb-4 text-sm text-green-500 font-medium">
            ✅ Successfully seeded 32 teams!
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-2.5 mb-4 text-sm text-danger font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleSeed}
          disabled={seeding}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          id="seed-btn"
        >
          {seeding ? "Seeding..." : "Seed 32 Teams"}
        </button>
      </div>
    </div>
  );
}
