"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AuraBadge from "@/components/ui/AuraBadge";

interface BattleListItem {
  id: string;
  title: string;
  topic: string;
  battle_type: string;
  mode: string;
  status: "open" | "live" | "judging" | "completed" | "cancelled";
  creator_username: string;
  creator_avatar: string;
  opponent_username: string | null;
  opponent_avatar: string | null;
}

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

const statusConfig = {
  open:      { label: "Open",       color: "text-aura-blue",   dot: "bg-aura-blue" },
  live:      { label: "LIVE",       color: "text-aura-crimson", dot: "bg-aura-crimson", pulse: true },
  judging:   { label: "Judging",    color: "text-aura-purple",  dot: "bg-aura-purple" },
  completed: { label: "Completed",  color: "text-white/40",     dot: "bg-white/30" },
  cancelled: { label: "Cancelled",  color: "text-white/25",     dot: "bg-white/20" },
};

const features = [
  {
    emoji: "⚖️",
    title: "AI Judge",
    desc: "Every battle scored across humor, creativity, originality, timing, and topic relevance. No human bias.",
    accent: "purple",
  },
  {
    emoji: "💜",
    title: "Real Aura Economy",
    desc: "Win real battles, your Aura updates instantly. Permanent history of every change. Zero pay-to-win.",
    accent: "blue",
  },
  {
    emoji: "⚔️",
    title: "Live Battles",
    desc: "Create a battle, wait for a real opponent to join, then trade roasts round by round.",
    accent: "crimson",
  },
  {
    emoji: "🛡️",
    title: "AI Moderation",
    desc: "Hate speech, threats, and harassment filtered in real time. Roast the take, not the person.",
    accent: "purple",
  },
];

const topics = [
  "Android vs iPhone", "Anime", "Football", "Cricket",
  "Gaming", "Movies", "Technology", "College Life", "Internet Culture",
];

const rankMedals = ["🥇", "🥈", "🥉"];

export default function HomePage() {
  const [battles, setBattles] = useState<BattleListItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/battles").then((r) => r.json()),
      fetch("/api/leaderboard").then((r) => r.json()),
    ])
      .then(([bd, ld]) => {
        setBattles(bd.battles ?? []);
        setLeaderboard(ld.leaderboard ?? []);
      })
      .catch(() => { setBattles([]); setLeaderboard([]); })
      .finally(() => setLoading(false));
  }, []);

  const liveBattles = battles.filter((b) => b.status === "live");
  const featuredBattles = battles.slice(0, 6);
  const topLeaders = leaderboard.slice(0, 5);

  return (
    <div className="overflow-x-hidden">

      {/* ═══════════════════════════════════
          HERO
      ═══════════════════════════════════ */}
      <section className="relative overflow-hidden bg-void">
        {/* Background layers */}
        <div className="absolute inset-0 bg-hero-glow" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "linear-gradient(rgba(166,91,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(166,91,255,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glowing orbs */}
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-aura-purple/10 blur-[120px]" />
        <div className="absolute -top-16 right-1/4 h-[400px] w-[400px] rounded-full bg-aura-blue/8 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-28 text-center sm:pt-32 sm:pb-36">
          {/* Live count pill */}
          <div className="mx-auto mb-8 inline-flex items-center gap-2.5 rounded-full border border-aura-purple/20 bg-aura-purple/8 px-5 py-2 text-xs font-semibold text-white/70 animate-rise backdrop-blur-sm">
            <span className={loading ? "h-2 w-2 rounded-full bg-white/40" : "live-dot animate-pulseGlow"} />
            {loading
              ? "Connecting to arena..."
              : `${liveBattles.length} battle${liveBattles.length === 1 ? "" : "s"} live right now`}
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl animate-rise">
            Win the roast.
            <br />
            <span className="text-gradient" style={{ textShadow: "0 0 80px rgba(166,91,255,0.4)" }}>
              Claim the Aura.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base text-white/50 sm:text-lg animate-rise leading-relaxed">
            Ragebait is an AI-judged arena for roast battles, debates, and meme wars.
            <br className="hidden sm:block" />
            Bring the wit — the AI keeps score, the crowd keeps it honest.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-rise">
            <Link href="/signup">
              <Button size="lg" className="shadow-glow">
                Create your profile
              </Button>
            </Link>
            <Link href="/battles">
              <Button size="lg" variant="secondary">
                View battles →
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-xs text-white/30 animate-rise">
            {[
              { value: "AI-Judged", label: "Every battle" },
              { value: "Zero", label: "Pay-to-win" },
              { value: "Real", label: "Aura economy" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <span className="font-display text-lg font-bold text-white/60">{item.value}</span>
                <span className="uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          LIVE BATTLES STRIP
      ═══════════════════════════════════ */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Active Battles
              </h2>
              <p className="mt-1 text-sm text-white/40">
                {loading ? "Fetching battles..." : `${battles.length} battles in the arena`}
              </p>
            </div>
            <Link href="/battles" className="group flex items-center gap-1 text-sm font-medium text-aura-blue hover:text-white transition-colors">
              View all
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl border border-line bg-surface2" />
              ))}
            </div>
          ) : featuredBattles.length === 0 ? (
            <Card className="py-16 text-center" hover={false}>
              <div className="text-4xl mb-4">⚔️</div>
              <p className="font-display text-lg font-semibold text-white/60">No battles yet</p>
              <p className="mt-2 text-sm text-white/40">Be the first to start one.</p>
              <div className="mt-6">
                <Link href="/signup">
                  <Button size="sm">Start a battle</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBattles.map((battle) => {
                const cfg = statusConfig[battle.status];
                return (
                  <Link key={battle.id} href={`/battles/${battle.id}`}>
                    <Card className="group flex h-full flex-col gap-4 cursor-pointer">
                      {/* Top row */}
                      <div className="flex items-center justify-between">
                        <span className="badge-purple">{battle.topic}</span>
                        <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${cfg.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${(cfg as any).pulse ? "animate-pulseGlow" : ""}`} />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-display text-base font-bold leading-snug group-hover:text-aura-purple transition-colors line-clamp-2">
                        {battle.title}
                      </h3>

                      {/* Participants */}
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1.5 rounded-full bg-surface2 px-2.5 py-1 border border-line/60">
                          <img src={avatarFor(battle.creator_username, battle.creator_avatar)} alt={battle.creator_username} className="h-4 w-4 rounded-full" />
                          <span className="text-xs text-white/60 truncate max-w-[70px]">{battle.creator_username}</span>
                        </div>
                        <span className="text-white/20 text-xs font-bold">VS</span>
                        {battle.opponent_username ? (
                          <div className="flex items-center gap-1.5 rounded-full bg-surface2 px-2.5 py-1 border border-line/60">
                            <img src={avatarFor(battle.opponent_username, battle.opponent_avatar)} alt={battle.opponent_username} className="h-4 w-4 rounded-full" />
                            <span className="text-xs text-white/60 truncate max-w-[70px]">{battle.opponent_username}</span>
                          </div>
                        ) : (
                          <span className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-white/25">Waiting...</span>
                        )}
                      </div>

                      {/* Footer meta */}
                      <div className="mt-auto flex items-center justify-between text-xs text-white/30">
                        <span className="capitalize">{battle.battle_type} · {battle.mode}</span>
                        <svg className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-aura-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════
          FEATURE GRID
      ═══════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-aura-purple">Platform</p>
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Built for skill, not hate.
          </h2>
          <p className="mt-4 text-white/50 leading-relaxed">
            Ragebait rewards humor, timing, and originality — and actively
            shuts down racism, harassment, and personal attacks.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Card
              key={f.title}
              className="relative overflow-hidden group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Subtle glow on hover */}
              <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                f.accent === "purple" ? "bg-aura-purple/30"
                : f.accent === "blue" ? "bg-aura-blue/30"
                : "bg-aura-crimson/30"
              }`} />

              <div className={`relative mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${
                f.accent === "purple" ? "bg-aura-purple/15 border border-aura-purple/20"
                : f.accent === "blue" ? "bg-aura-blue/15 border border-aura-blue/20"
                : "bg-aura-crimson/15 border border-aura-crimson/20"
              }`}>
                {f.emoji}
              </div>
              <h3 className="relative font-display text-base font-bold">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/45">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          LEADERBOARD PREVIEW
      ═══════════════════════════════════ */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-aura-gold">Rankings</p>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Top of the leaderboard
              </h2>
            </div>
            <Link href="/leaderboard" className="group flex items-center gap-1 text-sm font-medium text-aura-blue hover:text-white transition-colors">
              Full rankings
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl border border-line bg-surface2" />
              ))}
            </div>
          ) : topLeaders.length === 0 ? (
            <Card className="py-12 text-center" hover={false}>
              <p className="text-white/40">No users on the leaderboard yet.</p>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line">
              {topLeaders.map((entry, i) => (
                <div
                  key={entry.username}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-aura-purple/5 ${
                    i < topLeaders.length - 1 ? "border-b border-line" : ""
                  } ${i === 0 ? "bg-aura-gold/5" : ""}`}
                >
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0 text-center">
                    {i < 3 ? (
                      <span className="text-lg">{rankMedals[i]}</span>
                    ) : (
                      <span className="font-display text-sm font-bold text-white/30">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar + name */}
                  <div className="flex flex-1 items-center gap-3 min-w-0">
                    <img
                      src={avatarFor(entry.username, entry.avatarUrl)}
                      alt={entry.username}
                      className={`flex-shrink-0 rounded-full ${i === 0 ? "h-10 w-10 ring-2 ring-aura-gold/50" : "h-9 w-9"}`}
                    />
                    <div className="min-w-0">
                      <p className={`font-semibold truncate ${i === 0 ? "text-base" : "text-sm"}`}>
                        {entry.username}
                      </p>
                      <p className="text-xs text-white/30">{entry.wins} wins · {entry.winRate}% WR</p>
                    </div>
                  </div>

                  {/* Aura */}
                  <AuraBadge
                    value={entry.aura}
                    size="sm"
                    trend={i === 0 ? "up" : "neutral"}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════
          TOPICS
      ═══════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-aura-blue">Arenas</p>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Pick your battlefield
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {topics.map((topic, i) => (
            <Link
              key={topic}
              href={`/battles?topic=${encodeURIComponent(topic)}`}
              className="group flex items-center gap-2 rounded-full border border-line bg-surface2 px-5 py-2.5 text-sm font-medium text-white/60 transition-all duration-200 hover:border-aura-purple/50 hover:bg-aura-purple/8 hover:text-white"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-aura-purple/40 group-hover:bg-aura-purple transition-colors" />
              {topic}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════ */}
      <section className="relative overflow-hidden border-t border-line">
        <div className="absolute inset-0 bg-crimson-gradient opacity-10" />
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Your Aura starts at zero.
            <br />
            <span className="text-gradient-crimson">Where it goes is up to you.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/50">
            Join the arena. Battle real opponents. Earn Aura through skill alone.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" variant="danger">
                Create your profile
              </Button>
            </Link>
            <Link href="/battles">
              <Button size="lg" variant="secondary">
                Watch live battles
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
