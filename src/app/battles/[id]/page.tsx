"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AuraBadge from "@/components/ui/AuraBadge";
import StatBar from "@/components/ui/StatBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import clsx from "clsx";

interface Message {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  content: string;
  round: number;
  created_at: string;
  aura_change?: number;
}

interface Battle {
  id: string;
  title: string;
  topic: string;
  battle_type: string;
  mode: string;
  status: "open" | "live" | "judging" | "completed" | "cancelled";
  rounds: number;
  current_round: number;
  creator_id: string;
  creator_username: string;
  creator_avatar: string | null;
  creator_aura: number;
  opponent_id: string | null;
  opponent_username: string | null;
  opponent_avatar: string | null;
  opponent_aura: number | null;
  winner_id: string | null;
  ai_score_creator: number | null;
  ai_score_opponent: number | null;
  ai_summary: string | null;
  ai_winner_reasoning: string | null;
  created_at: string;
  messages: Message[];
}

function avatarFor(username: string, avatarUrl: string | null) {
  return avatarUrl || `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(username)}`;
}

const statusConfig = {
  open:      { label: "Open",      color: "text-aura-blue",    bg: "bg-aura-blue/10 border-aura-blue/20" },
  live:      { label: "Live",      color: "text-aura-crimson", bg: "bg-aura-crimson/10 border-aura-crimson/20", pulse: true },
  judging:   { label: "Judging",   color: "text-aura-purple",  bg: "bg-aura-purple/10 border-aura-purple/20" },
  completed: { label: "Completed", color: "text-white/50",     bg: "bg-white/5 border-white/10" },
  cancelled: { label: "Cancelled", color: "text-white/25",     bg: "bg-white/3 border-white/8" },
};

export default function BattlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();

  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [judging, setJudging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [judgeResult, setJudgeResult] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadBattle = useCallback(async () => {
    try {
      const res = await fetch(`/api/battles/${id}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setBattle(data.battle);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { loadBattle(); }, [loadBattle]);

  // Poll for updates when live or judging
  useEffect(() => {
    if (!battle || !["live", "judging"].includes(battle.status)) return;
    const interval = setInterval(loadBattle, 5000);
    return () => clearInterval(interval);
  }, [battle?.status, loadBattle]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [battle?.messages?.length]);

  async function handleSend() {
    if (!message.trim() || !user || !battle) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/battles/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send."); setSending(false); return; }
      setMessage("");
      await loadBattle();
    } catch {
      setError("Could not reach the server.");
    }
    setSending(false);
  }

  async function handleJudge() {
    if (!battle || !user) return;
    setJudging(true);
    setError(null);
    try {
      const res = await fetch(`/api/battles/${id}/judge`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Judging failed."); setJudging(false); return; }
      setJudgeResult(data);
      await loadBattle();
    } catch {
      setError("Could not reach the judge.");
    }
    setJudging(false);
  }

  if (loading) return <PageLoader />;

  if (!battle) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="text-5xl mb-4">⚔️</div>
        <h2 className="font-display text-2xl font-bold">Battle not found</h2>
        <p className="mt-2 text-white/40">This battle may have been removed or doesn't exist.</p>
        <div className="mt-8">
          <Link href="/battles"><Button variant="secondary">Back to battles</Button></Link>
        </div>
      </div>
    );
  }

  const cfg = statusConfig[battle.status];
  const isCreator = user?.id === battle.creator_id;
  const isOpponent = user?.id === battle.opponent_id;
  const isParticipant = isCreator || isOpponent;
  const myTurn = battle.status === "live" && isParticipant;

  const messages = battle.messages ?? [];
  const roundGroups = messages.reduce<Record<number, Message[]>>((acc, m) => {
    (acc[m.round] = acc[m.round] || []).push(m);
    return acc;
  }, {});

  const winnerUsername = battle.winner_id === battle.creator_id
    ? battle.creator_username
    : battle.winner_id === battle.opponent_id
    ? battle.opponent_username
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

      {/* Error bar */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-aura-crimson/30 bg-aura-crimson/10 px-5 py-4 text-sm text-aura-crimson">
          <span className="flex-shrink-0">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-white/30">
        <Link href="/battles" className="hover:text-white transition-colors">Battles</Link>
        <span>/</span>
        <span className="text-white/50 truncate max-w-[200px]">{battle.title}</span>
      </div>

      {/* Battle header */}
      <Card className="mb-6" glow={battle.status === "live" ? "crimson" : battle.status === "judging" ? "purple" : "none"}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="badge-purple">{battle.topic}</span>
              <span className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
                cfg.bg, cfg.color
              )}>
                <span className={clsx("h-1.5 w-1.5 rounded-full", {
                  "bg-aura-blue": battle.status === "open",
                  "bg-aura-crimson animate-pulseGlow": battle.status === "live",
                  "bg-aura-purple": battle.status === "judging",
                  "bg-white/30": battle.status === "completed",
                  "bg-white/20": battle.status === "cancelled",
                })} />
                {cfg.label}
              </span>
              <span className="text-xs text-white/30 capitalize">{battle.battle_type} · {battle.mode}</span>
            </div>
            <h1 className="font-display text-xl font-bold sm:text-2xl">{battle.title}</h1>
          </div>

          {/* Round indicator */}
          <div className="flex items-center gap-2 text-sm">
            {[...Array(battle.rounds)].map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "h-2 w-8 rounded-full transition-all",
                  i < battle.current_round ? "bg-aura-purple shadow-[0_0_8px_rgba(166,91,255,0.6)]"
                  : i === battle.current_round && battle.status === "live" ? "bg-aura-blue animate-pulseGlow"
                  : "bg-white/10"
                )}
              />
            ))}
            <span className="text-xs text-white/40 ml-1">
              {battle.current_round}/{battle.rounds}
            </span>
          </div>
        </div>

        {/* Combatants */}
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Creator */}
          <div className={clsx(
            "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
            battle.winner_id === battle.creator_id
              ? "border-aura-gold/40 bg-aura-gold/5"
              : "border-line bg-surface2/60"
          )}>
            <div className="relative">
              <img
                src={avatarFor(battle.creator_username, battle.creator_avatar)}
                alt={battle.creator_username}
                className="h-14 w-14 rounded-full"
              />
              {battle.winner_id === battle.creator_id && (
                <span className="absolute -top-1 -right-1 text-lg">🏆</span>
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">{battle.creator_username}</p>
              <AuraBadge value={battle.creator_aura} size="xs" trend="neutral" />
            </div>
            {battle.ai_score_creator != null && (
              <div className="w-full mt-1">
                <div className="text-center text-xs text-white/40 mb-1">AI Score</div>
                <StatBar
                  label=""
                  value={battle.ai_score_creator}
                  max={100}
                  color="blue"
                  showValue={false}
                />
                <div className="text-center text-sm font-bold text-aura-blue mt-1">
                  {battle.ai_score_creator}/100
                </div>
              </div>
            )}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-2xl font-black text-gradient-crimson">VS</span>
            <span className="text-xs text-white/25">Round {battle.current_round}</span>
          </div>

          {/* Opponent */}
          {battle.opponent_username ? (
            <div className={clsx(
              "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
              battle.winner_id === battle.opponent_id
                ? "border-aura-gold/40 bg-aura-gold/5"
                : "border-line bg-surface2/60"
            )}>
              <div className="relative">
                <img
                  src={avatarFor(battle.opponent_username, battle.opponent_avatar)}
                  alt={battle.opponent_username}
                  className="h-14 w-14 rounded-full"
                />
                {battle.winner_id === battle.opponent_id && (
                  <span className="absolute -top-1 -right-1 text-lg">🏆</span>
                )}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{battle.opponent_username}</p>
                <AuraBadge value={battle.opponent_aura ?? 0} size="xs" trend="neutral" />
              </div>
              {battle.ai_score_opponent != null && (
                <div className="w-full mt-1">
                  <div className="text-center text-xs text-white/40 mb-1">AI Score</div>
                  <StatBar
                    label=""
                    value={battle.ai_score_opponent}
                    max={100}
                    color="crimson"
                    showValue={false}
                  />
                  <div className="text-center text-sm font-bold text-aura-crimson mt-1">
                    {battle.ai_score_opponent}/100
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line p-4">
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center text-white/20 text-xl">?</div>
              <p className="text-sm text-white/30">Waiting for opponent</p>
              {user && !isCreator && (
                <Link href={`/battles/${battle.id}`}>
                  <Button size="xs">Join battle</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* AI Result card */}
      {battle.status === "completed" && (battle.ai_summary || winnerUsername) && (
        <Card className="mb-6" glow="purple" variant="elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aura-gradient text-void text-lg font-black flex-shrink-0">AI</div>
            <div>
              <p className="font-display font-bold text-white">AI Judge Verdict</p>
              <p className="text-xs text-white/40">Scored on humor, creativity, originality, timing & relevance</p>
            </div>
          </div>

          {winnerUsername && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-aura-gold/30 bg-aura-gold/8 px-4 py-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">Winner</p>
                <p className="font-display font-bold text-aura-gold text-lg">{winnerUsername}</p>
              </div>
            </div>
          )}

          {battle.ai_winner_reasoning && (
            <div className="mb-4 rounded-xl border border-line bg-surface2/50 px-4 py-3">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Reasoning</p>
              <p className="text-sm text-white/70 leading-relaxed">{battle.ai_winner_reasoning}</p>
            </div>
          )}

          {battle.ai_summary && (
            <div className="rounded-xl border border-line bg-surface2/50 px-4 py-3">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Battle Summary</p>
              <p className="text-sm text-white/60 leading-relaxed italic">"{battle.ai_summary}"</p>
            </div>
          )}
        </Card>
      )}

      {/* Messages */}
      <Card className="mb-6" padding="none">
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="font-display font-bold">Battle Feed</p>
            <span className="text-xs text-white/30">{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto p-5 space-y-6">
          {messages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-3xl mb-3">💬</div>
              <p className="text-white/40">
                {battle.status === "open"
                  ? "Waiting for an opponent to join..."
                  : "No messages yet — start the battle!"}
              </p>
            </div>
          ) : (
            Object.entries(roundGroups).map(([round, msgs]) => (
              <div key={round}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-line" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/25 px-2">
                    Round {round}
                  </span>
                  <div className="flex-1 h-px bg-line" />
                </div>
                <div className="space-y-4">
                  {msgs.map((msg) => {
                    const isMe = user?.id === msg.user_id;
                    const isWinner = battle.winner_id === msg.user_id;
                    return (
                      <div
                        key={msg.id}
                        className={clsx(
                          "flex gap-3",
                          isMe ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <img
                          src={avatarFor(msg.username, msg.avatar_url)}
                          alt={msg.username}
                          className="h-8 w-8 flex-shrink-0 rounded-full self-end"
                        />
                        <div className={clsx("max-w-[75%] space-y-1", isMe && "items-end flex flex-col")}>
                          <div className={clsx("flex items-center gap-2 text-xs text-white/40", isMe && "flex-row-reverse")}>
                            <span className="font-medium text-white/60">{msg.username}</span>
                            {isWinner && <span className="text-xs">🏆</span>}
                          </div>
                          <div className={clsx(
                            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                            isMe
                              ? "rounded-tr-sm bg-aura-purple/20 border border-aura-purple/20 text-white"
                              : "rounded-tl-sm bg-surface2 border border-line text-white/85"
                          )}>
                            {msg.content}
                          </div>
                          {msg.aura_change != null && msg.aura_change !== 0 && (
                            <div className={clsx("text-[11px]", isMe && "text-right")}>
                              <AuraBadge
                                value={Math.abs(msg.aura_change)}
                                size="xs"
                                trend={msg.aura_change > 0 ? "up" : "down"}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        {myTurn && battle.status === "live" && (
          <div className="border-t border-line p-4">
            <div className="flex gap-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Drop your roast here… keep it creative, not hateful."
                maxLength={500}
                rows={2}
                className="input-base resize-none"
              />
              <Button
                onClick={handleSend}
                loading={sending}
                disabled={!message.trim()}
                className="flex-shrink-0 self-end"
              >
                Send
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-white/25">
                Roast the <em>idea</em>, not the person. AI moderation is active.
              </p>
              <span className="text-xs text-white/25 tabular-nums">{message.length}/500</span>
            </div>
          </div>
        )}
      </Card>

      {/* Judge button */}
      {battle.status === "live" && isCreator && messages.length >= 2 && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="lg"
            loading={judging}
            onClick={handleJudge}
            icon={<span>⚖️</span>}
          >
            {judging ? "AI is judging..." : "Request AI Judgment"}
          </Button>
        </div>
      )}

      {/* Share */}
      {battle.status === "completed" && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            icon={<span>🔗</span>}
          >
            Copy link
          </Button>
          <Link href="/battles">
            <Button variant="ghost" size="sm">← All battles</Button>
          </Link>
          <Link href="/battles">
            <Button variant="primary" size="sm" icon={<span>⚔️</span>}>
              Start a new battle
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
