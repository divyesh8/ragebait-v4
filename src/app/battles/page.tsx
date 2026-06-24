"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import CreateBattleForm from "@/components/battle/CreateBattleForm";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import clsx from "clsx";

interface BattleListItem {
  id: string;
  title: string;
  topic: string;
  battle_type: string;
  mode: string;
  status: "open" | "live" | "judging" | "completed" | "cancelled";
  rounds: number;
  winner_id: string | null;
  ai_summary: string | null;
  created_at: string;
  creator_id: string;
  creator_username: string;
  creator_avatar: string;
  opponent_id: string | null;
  opponent_username: string | null;
  opponent_avatar: string | null;
}

const statusConfig = {
  open:      { label: "Open",       color: "text-aura-blue",    bg: "bg-aura-blue/10 border-aura-blue/20",    dot: "bg-aura-blue" },
  live:      { label: "Live",       color: "text-aura-crimson", bg: "bg-aura-crimson/10 border-aura-crimson/20", dot: "bg-aura-crimson", pulse: true },
  judging:   { label: "Judging",    color: "text-aura-purple",  bg: "bg-aura-purple/10 border-aura-purple/20",  dot: "bg-aura-purple" },
  completed: { label: "Done",       color: "text-white/40",     bg: "bg-white/5 border-white/10",               dot: "bg-white/30" },
  cancelled: { label: "Cancelled",  color: "text-white/25",     bg: "bg-white/3 border-white/8",                dot: "bg-white/20" },
};

const filterOptions = ["all", "live", "open", "judging", "completed"] as const;
type FilterOption = typeof filterOptions[number];

function avatarFor(username: string, avatarUrl: string | null) {
  return avatarUrl || `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(username)}`;
}

function BattleTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    casual: "😜", ranked: "🏆", friend: "🤝",
    tournament: "🎯", group: "🔥", event: "⚡",
  };
  return <span className="text-base">{icons[type] ?? "⚔️"}</span>;
}

export default function BattlesPage() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");

  const [battles, setBattles] = useState<BattleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [search, setSearch] = useState("");

  const loadBattles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/battles");
      const data = await res.json();
      setBattles(data.battles ?? []);
    } catch {
      setBattles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBattles(); }, [loadBattles]);

  async function handleJoin(battleId: string) {
    if (!user) { setError("Log in to join a battle."); return; }
    setJoiningId(battleId);
    setError(null);
    try {
      const res = await fetch(`/api/battles/${battleId}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not join this battle."); setJoiningId(null); return; }
      window.location.href = `/battles/${battleId}`;
    } catch {
      setError("Could not reach the server.");
      setJoiningId(null);
    }
  }

  const filtered = battles.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (topicParam && b.topic !== topicParam) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase()) &&
        !b.topic.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const liveCount = battles.filter((b) => b.status === "live").length;
  const openCount = battles.filter((b) => b.status === "open").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Battles</h1>
          <p className="mt-2 text-sm text-white/40">
            Real roast battles, judged by AI.
            {!loading && (
              <span className="ml-2">
                <span className="text-aura-crimson font-medium">{liveCount} live</span>
                {" · "}
                <span className="text-aura-blue font-medium">{openCount} open</span>
              </span>
            )}
          </p>
        </div>
        {user ? (
          <Button onClick={() => setShowCreate(true)} icon={<span>⚔️</span>}>
            Start a battle
          </Button>
        ) : (
          <Link href="/login">
            <Button variant="secondary">Log in to battle</Button>
          </Link>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-aura-crimson/30 bg-aura-crimson/10 px-5 py-4 text-sm text-aura-crimson">
          <span className="text-base flex-shrink-0">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-aura-crimson/60 hover:text-aura-crimson">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Status filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={clsx(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all border",
                filter === opt
                  ? "bg-aura-purple text-void border-aura-purple shadow-glow-sm"
                  : "border-line bg-surface2 text-white/50 hover:border-aura-purple/40 hover:text-white"
              )}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search battles..."
            className="input-base pl-10 py-2 w-full sm:w-64 text-xs"
          />
        </div>
      </div>

      {/* Topic filter indicator */}
      {topicParam && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm text-white/50">Filtering by topic:</span>
          <span className="badge-purple">{topicParam}</span>
          <Link href="/battles" className="text-xs text-aura-crimson hover:underline">Clear</Link>
        </div>
      )}

      {/* Battles grid */}
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="⚔️"
          title={search ? "No battles match your search" : "No battles here yet"}
          description={search ? "Try different keywords." : "Be the first to start one!"}
          action={user ? (
            <Button onClick={() => setShowCreate(true)}>Start a battle</Button>
          ) : (
            <Link href="/signup"><Button>Join to start a battle</Button></Link>
          )}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((battle) => {
            const cfg = statusConfig[battle.status];
            const isOwner = user && battle.creator_id === user.id;
            const canJoin = battle.status === "open" && user && !isOwner;

            return (
              <Card key={battle.id} className="flex flex-col gap-4 group">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <span className="badge-purple text-[11px] truncate max-w-[140px]">{battle.topic}</span>
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                    cfg.bg, cfg.color
                  )}>
                    <span className={clsx("h-1.5 w-1.5 rounded-full", cfg.dot, (cfg as any).pulse && "animate-pulseGlow")} />
                    {cfg.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display text-sm font-bold leading-snug group-hover:text-aura-purple transition-colors line-clamp-2">
                  {battle.title}
                </h3>

                {/* Participants */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-surface2 border border-line/50 px-2.5 py-1 min-w-0">
                    <img src={avatarFor(battle.creator_username, battle.creator_avatar)} alt={battle.creator_username} className="h-4 w-4 flex-shrink-0 rounded-full" />
                    <span className="text-xs text-white/60 truncate max-w-[65px]">{battle.creator_username}</span>
                  </div>
                  <span className="text-white/25 text-xs font-bold flex-shrink-0">VS</span>
                  {battle.opponent_username ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-surface2 border border-line/50 px-2.5 py-1 min-w-0">
                      <img src={avatarFor(battle.opponent_username, battle.opponent_avatar)} alt={battle.opponent_username} className="h-4 w-4 flex-shrink-0 rounded-full" />
                      <span className="text-xs text-white/60 truncate max-w-[65px]">{battle.opponent_username}</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-white/25">
                      <span className="h-3 w-3 rounded-full border border-dashed border-white/20" />
                      Open slot
                    </span>
                  )}
                </div>

                {/* AI summary snippet */}
                {battle.ai_summary && (
                  <div className="rounded-xl border border-line bg-surface2/50 px-3 py-2">
                    <p className="text-xs text-white/45 line-clamp-2 italic">"{battle.ai_summary}"</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between text-[11px] text-white/30">
                  <div className="flex items-center gap-2">
                    <BattleTypeIcon type={battle.battle_type} />
                    <span className="capitalize">{battle.battle_type}</span>
                    <span>·</span>
                    <span className="capitalize">{battle.mode}</span>
                    <span>·</span>
                    <span>{battle.rounds}R</span>
                  </div>
                </div>

                {/* Action button */}
                {canJoin ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    loading={joiningId === battle.id}
                    onClick={() => handleJoin(battle.id)}
                  >
                    {joiningId === battle.id ? "Joining..." : "⚔️ Join battle"}
                  </Button>
                ) : (
                  <Link href={`/battles/${battle.id}`}>
                    <Button variant="secondary" size="sm" fullWidth>
                      {battle.status === "completed" ? "View result" :
                       battle.status === "live" ? "Watch live" :
                       battle.status === "judging" ? "See judging" : "View battle"}
                    </Button>
                  </Link>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create battle modal */}
      {showCreate && (
        <CreateBattleForm
          onCreated={loadBattles}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
