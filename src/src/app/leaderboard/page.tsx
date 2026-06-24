"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import AuraBadge from "@/components/ui/AuraBadge";
import StatBar from "@/components/ui/StatBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import clsx from "clsx";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  aura: number;
  wins: number;
  losses: number;
  winRate: number;
  totalBattles: number;
  level?: number;
}

function avatarFor(username: string, avatarUrl: string | null) {
  return avatarUrl || `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(username)}`;
}

function getLevel(aura: number) {
  const thresholds = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000];
  let level = 1;
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (aura >= thresholds[i]) level = i + 1;
  }
  return level;
}

const podiumConfig = [
  { rank: 1, size: "h-24 w-24", nameSize: "text-base", ringColor: "ring-aura-gold",   order: "order-2", height: "h-24", bgGlow: "bg-aura-gold/15",   medal: "🥇", auraColor: "text-aura-gold"   },
  { rank: 2, size: "h-18 w-18", nameSize: "text-sm",   ringColor: "ring-white/30",    order: "order-1", height: "h-16", bgGlow: "bg-white/5",         medal: "🥈", auraColor: "text-white/60"    },
  { rank: 3, size: "h-16 w-16", nameSize: "text-sm",   ringColor: "ring-aura-gold/30",order: "order-3", height: "h-12", bgGlow: "bg-aura-gold/8",    medal: "🥉", auraColor: "text-aura-gold/60" },
];

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"all" | "week" | "month">("all");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d.leaderboard ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [period]);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

      {/* Header */}
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-aura-gold">Rankings</p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          The Arena Leaderboard
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Ranked by total Aura. Earn it through battle — never buy it.
        </p>
      </div>

      {/* Period selector */}
      <div className="mb-10 flex justify-center">
        <div className="flex items-center gap-1 rounded-2xl border border-line bg-surface p-1">
          {(["all", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                "rounded-xl px-5 py-2 text-sm font-semibold capitalize transition-all",
                period === p
                  ? "bg-aura-gold text-void shadow-glow-gold"
                  : "text-white/50 hover:text-white"
              )}
            >
              {p === "all" ? "All Time" : `This ${p.charAt(0).toUpperCase() + p.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : data.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No rankings yet"
          description="Complete battles to earn Aura and appear here."
        />
      ) : (
        <>
          {/* Podium — top 3 */}
          {top3.length >= 3 && (
            <div className="mb-12 flex items-end justify-center gap-4">
              {podiumConfig.map((cfg) => {
                const entry = top3[cfg.rank - 1];
                if (!entry) return null;
                const level = getLevel(entry.aura);
                return (
                  <div
                    key={cfg.rank}
                    className={clsx(
                      "flex flex-col items-center gap-2 rounded-2xl border border-line p-4 transition-all hover:border-aura-purple/30",
                      cfg.order, cfg.bgGlow,
                      cfg.rank === 1 ? "border-aura-gold/30 glow-gold w-36 sm:w-44" : "w-28 sm:w-36"
                    )}
                  >
                    <span className="text-2xl">{cfg.medal}</span>
                    <div className="relative">
                      <img
                        src={avatarFor(entry.username, entry.avatarUrl)}
                        alt={entry.username}
                        className={clsx(
                          cfg.size === "h-24 w-24" ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-14 sm:w-14",
                          "rounded-full ring-2", cfg.ringColor
                        )}
                      />
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-surface bg-aura-gradient text-void text-[10px] font-black">
                        {level}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={clsx(cfg.nameSize, "font-bold truncate max-w-[90px]")}>{entry.username}</p>
                      <AuraBadge value={entry.aura} size="xs" trend="neutral" />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-white/35">
                      <span>{entry.wins}W</span>
                      <span className={clsx("font-semibold", cfg.auraColor)}>{entry.winRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of leaderboard */}
          <div className="overflow-hidden rounded-2xl border border-line">
            {(top3.length < 3 ? data : rest).map((entry, i) => {
              const actualRank = top3.length < 3 ? entry.rank : entry.rank;
              const level = getLevel(entry.aura);
              return (
                <div
                  key={entry.userId}
                  className={clsx(
                    "flex items-center gap-4 px-5 py-4 transition-colors hover:bg-aura-purple/5",
                    i < (top3.length < 3 ? data.length - 1 : rest.length - 1) ? "border-b border-line" : ""
                  )}
                >
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0 text-center">
                    <span className="font-mono text-sm font-bold text-white/30">#{actualRank}</span>
                  </div>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={avatarFor(entry.username, entry.avatarUrl)}
                      alt={entry.username}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-surface bg-aura-gradient text-void text-[9px] font-black">
                      {level}
                    </div>
                  </div>

                  {/* Name + stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{entry.username}</p>
                    </div>
                    <div className="mt-1 w-full max-w-[160px]">
                      <StatBar
                        label=""
                        value={entry.winRate}
                        max={100}
                        color="purple"
                        showValue={false}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Battle stats */}
                  <div className="hidden sm:flex items-center gap-4 text-xs text-white/35">
                    <span><span className="text-aura-green font-semibold">{entry.wins}W</span></span>
                    <span><span className="text-aura-crimson font-semibold">{entry.losses}L</span></span>
                    <span className="text-white/50">{entry.winRate}% WR</span>
                  </div>

                  {/* Aura */}
                  <AuraBadge value={entry.aura} size="sm" trend="neutral" />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
