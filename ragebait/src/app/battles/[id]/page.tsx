"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

interface BattleDetail {
  id: string;
  title: string;
  topic: string;
  battle_type: string;
  mode: string;
  status: "open" | "live" | "judging" | "completed" | "cancelled";
  rounds: number;
  winner_id: string | null;
  ai_summary: string | null;
  ai_scores: {
    creator?: Record<string, number>;
    opponent?: Record<string, number>;
    feedback?: { creator?: string; opponent?: string };
  } | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  creator_id: string;
  creator_username: string;
  creator_avatar: string;
  opponent_id: string | null;
  opponent_username: string | null;
  opponent_avatar: string | null;
}

interface BattleMessage {
  id: string;
  content: string;
  round: number;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url: string;
}

function avatarFor(username: string, avatarUrl: string | null) {
  return avatarUrl || `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(username)}`;
}

const scoreLabels: Record<string, string> = {
  humor: "Humor",
  creativity: "Creativity",
  originality: "Originality",
  topicRelevance: "Topic Relevance",
  timing: "Timing",
  comebackQuality: "Comeback Quality",
  confidence: "Confidence",
  wordplay: "Wordplay",
  consistency: "Consistency",
  total: "Total",
};

export default function BattleDetailPage() {
  const params = useParams();
  const battleId = params.id as string;
  const { user } = useCurrentUser();

  const [battle, setBattle] = useState<BattleDetail | null>(null);
  const [messages, setMessages] = useState<BattleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [judging, setJudging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/battles/${battleId}`);
      const data = await res.json();
      if (res.ok) {
        setBattle(data.battle);
        setMessages(data.messages ?? []);
      } else {
        setError(data.error ?? "Battle not found.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [battleId]);

  useEffect(() => {
    load();
  }, [load]);

  // Light polling while the battle is live so both players see new roasts.
  useEffect(() => {
    if (!battle || battle.status !== "live") return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [battle, load]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    setError(null);

    try {
      const res = await fetch(`/api/battles/${battleId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not post message.");
        setPosting(false);
        return;
      }
      setContent("");
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPosting(false);
    }
  }

  async function handleJudge() {
    setJudging(true);
    setError(null);
    try {
      const res = await fetch(`/api/battles/${battleId}/judge`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not judge this battle.");
        setJudging(false);
        return;
      }
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setJudging(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-6 py-12 text-center text-white/50">Loading battle...</div>;
  }

  if (!battle) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 text-center">
        <p className="text-white/60">{error ?? "Battle not found."}</p>
        <Link href="/battles" className="mt-4 inline-block text-aura-blue hover:underline">
          Back to battles
        </Link>
      </div>
    );
  }

  const isParticipant = user && (user.id === battle.creator_id || user.id === battle.opponent_id);
  const myMessageCount = user
    ? messages.filter((m) => m.user_id === user.id).length
    : 0;
  const canPost = isParticipant && battle.status === "live" && myMessageCount < battle.rounds;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/battles" className="text-sm text-white/40 hover:text-white">
        ← Back to battles
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">{battle.title}</h1>
        <span className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium uppercase tracking-wide text-aura-purple">
          {battle.topic}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img src={avatarFor(battle.creator_username, battle.creator_avatar)} alt={battle.creator_username} className="h-8 w-8 rounded-full" />
          <span className="text-sm font-medium">{battle.creator_username}</span>
          {battle.winner_id === battle.creator_id && <span className="text-xs text-aura-blue">🏆</span>}
        </div>
        <span className="text-white/30">vs</span>
        {battle.opponent_username ? (
          <div className="flex items-center gap-2">
            <img src={avatarFor(battle.opponent_username, battle.opponent_avatar)} alt={battle.opponent_username} className="h-8 w-8 rounded-full" />
            <span className="text-sm font-medium">{battle.opponent_username}</span>
            {battle.winner_id === battle.opponent_id && <span className="text-xs text-aura-blue">🏆</span>}
          </div>
        ) : (
          <span className="text-sm text-white/30">Waiting for opponent...</span>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-aura-crimson/40 bg-aura-crimson/10 px-4 py-3 text-sm text-aura-crimson">
          {error}
        </div>
      )}

      {/* AI summary / scores once completed */}
      {battle.status === "completed" && battle.ai_summary && (
        <Card className="mt-6">
          <h2 className="font-display text-lg font-bold">AI Judge Verdict</h2>
          <p className="mt-2 text-sm text-white/70">{battle.ai_summary}</p>

          {battle.ai_scores && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(["creator", "opponent"] as const).map((side) => {
                const scores = battle.ai_scores?.[side];
                const name = side === "creator" ? battle.creator_username : battle.opponent_username;
                const feedback = battle.ai_scores?.feedback?.[side];
                if (!scores) return null;
                return (
                  <div key={side} className="rounded-xl border border-line bg-surface2 p-4">
                    <p className="font-display font-semibold">{name}</p>
                    <div className="mt-2 space-y-1 text-xs text-white/60">
                      {Object.entries(scores).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{scoreLabels[key] ?? key}</span>
                          <span className="font-mono text-aura-blue">{value}</span>
                        </div>
                      ))}
                    </div>
                    {feedback && (
                      <p className="mt-3 text-xs italic text-white/50">{feedback}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Judging prompt */}
      {battle.status === "judging" && isParticipant && (
        <Card className="mt-6 text-center">
          <p className="text-white/70">
            Both players have finished. Ready for the AI Judge to score this battle.
          </p>
          <Button className="mt-4" onClick={handleJudge} disabled={judging}>
            {judging ? "Judging..." : "Run AI Judge"}
          </Button>
        </Card>
      )}

      {battle.status === "judging" && !isParticipant && (
        <Card className="mt-6 text-center">
          <p className="text-white/60">This battle is awaiting AI judging.</p>
        </Card>
      )}

      {/* Messages / roasts */}
      <div className="mt-8 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-white/30">No roasts posted yet.</p>
        ) : (
          messages.map((msg) => {
            const isCreator = msg.user_id === battle.creator_id;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isCreator ? "" : "flex-row-reverse text-right"}`}
              >
                <img
                  src={avatarFor(msg.username, msg.avatar_url)}
                  alt={msg.username}
                  className="h-8 w-8 flex-shrink-0 rounded-full"
                />
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isCreator ? "bg-surface2" : "bg-aura-gradient text-void"}`}>
                  <p className={`text-xs font-medium ${isCreator ? "text-white/40" : "text-void/60"}`}>
                    {msg.username} · Round {msg.round}
                  </p>
                  <p className="mt-1 text-sm">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      {canPost && (
        <form onSubmit={handlePost} className="mt-6 flex gap-3">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Roast #${myMessageCount + 1} of ${battle.rounds}...`}
            maxLength={1000}
            className="flex-1 rounded-xl border border-line bg-surface2 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:border-aura-purple"
          />
          <Button type="submit" disabled={posting}>
            {posting ? "Posting..." : "Post"}
          </Button>
        </form>
      )}

      {isParticipant && battle.status === "live" && !canPost && myMessageCount >= battle.rounds && (
        <p className="mt-6 text-center text-sm text-white/40">
          You've posted all {battle.rounds} of your roasts. Waiting for your opponent...
        </p>
      )}

      {battle.status === "open" && (
        <p className="mt-6 text-center text-sm text-white/40">
          Waiting for an opponent to join this battle.
        </p>
      )}
    </div>
  );
}
