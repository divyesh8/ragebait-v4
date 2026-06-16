"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import AuraBadge from "@/components/ui/AuraBadge";

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatarUrl: string | null;
  aura: number;
  wins: number;
  winRate: number;
}

function avatarFor(username: string, avatarUrl: string | null) {
  return avatarUrl || `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(username)}`;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => setEntries(data.leaderboard ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold">Leaderboard</h1>
      <p className="mt-2 text-white/50">
        Real rankings by Aura, based on actual battle results.
      </p>

      {loading ? (
        <p className="mt-8 text-white/50">Loading...</p>
      ) : entries.length === 0 ? (
        <Card className="mt-8 text-center">
          <p className="text-white/60">
            No users yet. Be the first to sign up and start earning Aura.
          </p>
        </Card>
      ) : (
        <Card className="mt-8 overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-surface2 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Aura</th>
                <th className="px-6 py-3">Wins</th>
                <th className="px-6 py-3">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.username} className="border-t border-line">
                  <td className="px-6 py-4 font-display font-bold text-white/70">
                    {entry.rank <= 3 ? (
                      <span
                        className={
                          entry.rank === 1
                            ? "text-aura-purple"
                            : entry.rank === 2
                            ? "text-aura-blue"
                            : "text-aura-crimson"
                        }
                      >
                        #{entry.rank}
                      </span>
                    ) : (
                      `#${entry.rank}`
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarFor(entry.username, entry.avatarUrl)}
                        alt={entry.username}
                        className="h-8 w-8 rounded-full"
                      />
                      <span className="font-medium">{entry.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <AuraBadge value={entry.aura} size="sm" trend="neutral" />
                  </td>
                  <td className="px-6 py-4 text-white/70">{entry.wins}</td>
                  <td className="px-6 py-4 text-white/70">{entry.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
