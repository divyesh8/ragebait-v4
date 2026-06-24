"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AuraBadge from "@/components/ui/AuraBadge";
import StatBar from "@/components/ui/StatBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import clsx from "clsx";

interface AuraTransaction {
  id: string;
  amount: number;
  reason: string;
  category: string;
  created_at: string;
  battle_id?: string;
}

interface BattleSummary {
  id: string;
  title: string;
  topic: string;
  status: string;
  battle_type: string;
  opponent_username: string | null;
  winner_id: string | null;
  created_at: string;
}

const categoryColors: Record<string, string> = {
  win:             "text-aura-green",
  loss:            "text-aura-crimson",
  moderation:      "text-aura-crimson",
  bonus:           "text-aura-gold",
  penalty:         "text-aura-crimson",
  event:           "text-aura-blue",
  achievement:     "text-aura-purple",
  daily_challenge: "text-aura-blue",
};

const categoryIcon: Record<string, string> = {
  win:             "🏆",
  loss:            "💀",
  moderation:      "🛡️",
  bonus:           "⭐",
  penalty:         "⚠️",
  event:           "⚡",
  achievement:     "🎖️",
  daily_challenge: "📅",
};

function getLevel(aura: number): { level: number; progress: number; nextThreshold: number; title: string } {
  const thresholds = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000];
  const titles = ["Newcomer", "Contender", "Rager", "Hot Head", "Flame Starter", "Inferno", "Wildfire", "Blazing", "Legendary", "GOD MODE"];
  let level = 0;
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (aura >= thresholds[i]) level = i;
  }
  const current = thresholds[level];
  const next = thresholds[level + 1] ?? thresholds[thresholds.length - 1] * 2;
  const progress = Math.min(100, ((aura - current) / (next - current)) * 100);
  return { level: level + 1, progress, nextThreshold: next, title: titles[level] };
}

export default function ProfilePage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();
  const [auraHistory, setAuraHistory] = useState<AuraTransaction[]>([]);
  const [battles, setBattles] = useState<BattleSummary[]>([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"aura" | "battles">("aura");

  useEffect(() => {
    if (!user) return;
    setBio(user.bio ?? "");

    Promise.all([
      fetch("/api/aura/history").then((r) => r.json()),
      fetch("/api/battles").then((r) => r.json()),
    ]).then(([ah, bd]) => {
      setAuraHistory(ah.history ?? []);
      const userBattles = (bd.battles ?? []).filter(
        (b: any) => b.creator_id === user.id || b.opponent_id === user.id
      );
      setBattles(userBattles);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  async function handleSaveBio() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      setEditing(false);
    } catch {}
    setSaving(false);
  }

  if (loading || !user) return <PageLoader />;

  const { level, progress, nextThreshold, title } = getLevel(user.aura);
  const avatarUrl = user.avatar_url || `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(user.username)}`;

  const wins = battles.filter((b) => b.winner_id === user.id).length;
  const losses = battles.filter((b) => b.status === "completed" && b.winner_id !== user.id && b.winner_id !== null).length;
  const winRate = battles.filter((b) => b.status === "completed").length > 0
    ? Math.round((wins / battles.filter((b) => b.status === "completed").length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

      {/* Profile hero */}
      <Card className="mb-6 overflow-hidden" padding="none">
        {/* Banner */}
        <div className="h-28 sm:h-36 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a0a3e 0%, #0a1a3e 50%, #1a0020 100%)" }}>
          <div className="absolute inset-0 bg-grid-glow opacity-60" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "linear-gradient(rgba(166,91,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(166,91,255,0.1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="px-5 pb-5 sm:px-6">
          {/* Avatar row */}
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-10 mb-4">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={user.username}
                className="h-20 w-20 rounded-2xl border-4 border-surface ring-2 ring-aura-purple/30 shadow-glow-sm"
              />
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-aura-gradient text-void text-xs font-black shadow-glow-sm">
                {level}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!editing ? (
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)} icon={<span>✏️</span>}>
                  Edit bio
                </Button>
              ) : (
                <Button size="sm" loading={saving} onClick={handleSaveBio}>Save</Button>
              )}
            </div>
          </div>

          {/* Name + title */}
          <div className="mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold">{user.username}</h1>
              <span className="badge-purple text-[11px]">{title}</span>
            </div>
            {user.display_name && user.display_name !== user.username && (
              <p className="text-sm text-white/50">{user.display_name}</p>
            )}
          </div>

          {/* Bio */}
          {editing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={2}
              className="input-base mb-3 text-sm"
              placeholder="What's your deal? 160 chars max."
              autoFocus
            />
          ) : (
            user.bio && (
              <p className="mb-3 text-sm text-white/60 leading-relaxed">{user.bio}</p>
            )
          )}

          {/* Aura + level */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <AuraBadge value={user.aura} size="md" trend="neutral" animated />
            <div className="flex items-center gap-1.5 text-sm text-white/40">
              <span className="text-white/60">Lv.{level}</span>
              <span>·</span>
              <span className="capitalize">{title}</span>
            </div>
          </div>

          {/* Level progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs text-white/35">
              <span>Level {level} progress</span>
              <span className="font-mono">{user.aura.toLocaleString()} / {nextThreshold.toLocaleString()} AURA</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-aura-gradient shadow-[0_0_10px_rgba(166,91,255,0.5)] transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Battles", value: battles.length, color: "text-white" },
          { label: "Wins",    value: wins,           color: "text-aura-green" },
          { label: "Losses",  value: losses,          color: "text-aura-crimson" },
          { label: "Win Rate", value: `${winRate}%`, color: "text-aura-purple" },
        ].map((stat) => (
          <Card key={stat.label} hover={false} className="text-center py-5">
            <div className={clsx("font-display text-2xl font-bold", stat.color)}>{stat.value}</div>
            <div className="mt-1 text-xs text-white/40">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-2xl border border-line bg-surface p-1">
        {(["aura", "battles"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize transition-all",
              tab === t
                ? "bg-aura-purple text-void shadow-glow-sm"
                : "text-white/50 hover:text-white"
            )}
          >
            {t === "aura" ? "⚡ Aura History" : "⚔️ My Battles"}
          </button>
        ))}
      </div>

      {/* Aura history */}
      {tab === "aura" && (
        <div className="space-y-3">
          {auraHistory.length === 0 ? (
            <Card className="py-12 text-center" hover={false}>
              <div className="text-3xl mb-3">⚡</div>
              <p className="text-white/40">No Aura changes yet. Win some battles!</p>
            </Card>
          ) : (
            auraHistory.map((tx) => (
              <Card key={tx.id} className="flex items-center gap-4 py-4">
                <div className={clsx(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg",
                  tx.amount > 0 ? "bg-aura-green/10 border border-aura-green/20" : "bg-aura-crimson/10 border border-aura-crimson/20"
                )}>
                  {categoryIcon[tx.category] ?? (tx.amount > 0 ? "↑" : "↓")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{tx.reason}</p>
                  <p className="text-xs text-white/35 mt-0.5">
                    {new Date(tx.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                <AuraBadge
                  value={Math.abs(tx.amount)}
                  size="sm"
                  trend={tx.amount > 0 ? "up" : "down"}
                />
              </Card>
            ))
          )}
        </div>
      )}

      {/* Battle history */}
      {tab === "battles" && (
        <div className="space-y-3">
          {battles.length === 0 ? (
            <Card className="py-12 text-center" hover={false}>
              <div className="text-3xl mb-3">⚔️</div>
              <p className="text-white/40">No battles yet.</p>
              <div className="mt-4">
                <Link href="/battles"><Button size="sm">Find a battle</Button></Link>
              </div>
            </Card>
          ) : (
            battles.map((battle) => {
              const isWin = battle.winner_id === user.id;
              const isLoss = battle.status === "completed" && battle.winner_id !== null && !isWin;
              return (
                <Link key={battle.id} href={`/battles/${battle.id}`}>
                  <Card className="flex items-center gap-4 hover:border-aura-purple/40">
                    <div className={clsx(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold",
                      isWin ? "bg-aura-green/10 border border-aura-green/20 text-aura-green"
                      : isLoss ? "bg-aura-crimson/10 border border-aura-crimson/20 text-aura-crimson"
                      : "bg-surface2 border border-line text-white/40"
                    )}>
                      {isWin ? "W" : isLoss ? "L" : "—"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{battle.title}</p>
                      <p className="text-xs text-white/35 mt-0.5">
                        {battle.opponent_username ? `vs ${battle.opponent_username}` : "No opponent yet"}
                        {" · "}
                        <span className="capitalize">{battle.topic}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={clsx(
                        "text-xs font-bold capitalize px-2 py-0.5 rounded-full",
                        battle.status === "live" ? "text-aura-crimson bg-aura-crimson/10" :
                        battle.status === "open" ? "text-aura-blue bg-aura-blue/10" :
                        battle.status === "completed" ? "text-white/40 bg-white/5" :
                        "text-aura-purple bg-aura-purple/10"
                      )}>{battle.status}</span>
                      <svg className="h-4 w-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
