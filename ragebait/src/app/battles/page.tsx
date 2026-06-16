"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CreateBattleForm from "@/components/battle/CreateBattleForm";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

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

const statusStyles: Record<string, string> = {
  open: "text-aura-blue",
  live: "text-aura-crimson",
  judging: "text-aura-purple",
  completed: "text-white/40",
  cancelled: "text-white/30",
};

const statusLabels: Record<string, string> = {
  open: "Open — needs opponent",
  live: "Live",
  judging: "AI Judging",
  completed: "Completed",
  cancelled: "Cancelled",
};

function avatarFor(username: string, avatarUrl: string | null) {
  return avatarUrl || `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(username)}`;
}

export default function BattlesPage() {
  const { user } = useCurrentUser();
  const [battles, setBattles] = useState<BattleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadBattles() {
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
  }

  useEffect(() => {
    loadBattles();
  }, []);

  async function handleJoin(battleId: string) {
    if (!user) {
      setError("Log in to join a battle.");
      return;
    }
    setJoiningId(battleId);
    setError(null);
    try {
      const res = await fetch(`/api/battles/${battleId}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not join this battle.");
        setJoiningId(null);
        return;
      }
      window.location.href = `/battles/${battleId}`;
    } catch {
      setError("Could not reach the server.");
      setJoiningId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Battles</h1>
          <p className="mt-2 text-white/50">
            Real roast battles, judged by AI. Create one, wait for an opponent, then trade roasts.
          </p>
        </div>
        {user ? (
          <Button size="md" onClick={() => setShowCreate(true)}>
            + Start a battle
          </Button>
        ) : (
          <Link href="/login">
            <Button size="md" variant="secondary">
              Log in to start a battle
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-aura-crimson/40 bg-aura-crimson/10 px-4 py-3 text-sm text-aura-crimson">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/50">Loading battles...</p>
      ) : battles.length === 0 ? (
        <Card className="text-center">
          <p className="text-white/60">
            No battles yet. Be the first to start one!
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {battles.map((battle) => (
            <Card key={battle.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium uppercase tracking-wide text-aura-purple">
                  {battle.topic}
                </span>
                <span className={`text-xs font-semibold uppercase ${statusStyles[battle.status]}`}>
                  {battle.status === "live" && (
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulseGlow rounded-full bg-aura-crimson" />
                  )}
                  {statusLabels[battle.status]}
                </span>
              </div>

              <h3 className="font-display text-lg font-semibold leading-snug">
                {battle.title}
              </h3>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full bg-surface2 px-2.5 py-1">
                  <img
                    src={avatarFor(battle.creator_username, battle.creator_avatar)}
                    alt={battle.creator_username}
                    className="h-5 w-5 rounded-full"
                  />
                  <span className="text-xs text-white/70">{battle.creator_username}</span>
                </div>
                {battle.opponent_username ? (
                  <div className="flex items-center gap-2 rounded-full bg-surface2 px-2.5 py-1">
                    <img
                      src={avatarFor(battle.opponent_username, battle.opponent_avatar)}
                      alt={battle.opponent_username}
                      className="h-5 w-5 rounded-full"
                    />
                    <span className="text-xs text-white/70">{battle.opponent_username}</span>
                  </div>
                ) : (
                  <span className="text-xs text-white/30">Waiting for opponent...</span>
                )}
              </div>

              {battle.ai_summary && (
                <div className="rounded-xl border border-line bg-surface2 p-3 text-xs text-white/60">
                  {battle.ai_summary}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between text-xs text-white/40">
                <div className="flex gap-3">
                  <span className="capitalize">{battle.battle_type} battle</span>
                  <span className="capitalize">{battle.mode}</span>
                </div>
                <span>{battle.rounds} rounds</span>
              </div>

              {battle.status === "open" && user && battle.creator_id !== user.id ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => handleJoin(battle.id)}
                  disabled={joiningId === battle.id}
                >
                  {joiningId === battle.id ? "Joining..." : "Join battle"}
                </Button>
              ) : (
                <Link href={`/battles/${battle.id}`}>
                  <Button variant="secondary" size="sm" className="w-full">
                    {battle.status === "completed" || battle.status === "judging"
                      ? "View result"
                      : battle.status === "open"
                      ? "View battle"
                      : "Open battle"}
                  </Button>
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateBattleForm
          onCreated={loadBattles}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
