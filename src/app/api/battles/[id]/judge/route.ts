import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

interface JudgeScore {
  humor: number; creativity: number; originality: number;
  topicRelevance: number; timing: number; comebackQuality: number;
  confidence: number; wordplay: number; consistency: number; total: number;
}
interface JudgeResult {
  scores: Record<string, JudgeScore>;
  winner: "creator" | "opponent" | "draw";
  summary: string;
  feedback: Record<string, string>;
}

const AURA_WIN = 25;
const AURA_DOMINANT_WIN = 50;
const AURA_LOSS = -15;
const DOMINANT_MARGIN = 20;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = params;

  try {
    const battleRows = await sql`
      SELECT b.id, b.title, b.topic, b.status, b.rounds,
             b.created_by, b.opponent_id,
             creator.username  AS creator_username,
             opponent.username AS opponent_username
      FROM battles b
      JOIN users creator ON creator.id = b.created_by
      LEFT JOIN users opponent ON opponent.id = b.opponent_id
      WHERE b.id = ${id}
      LIMIT 1
    `;

    if (battleRows.length === 0) {
      return NextResponse.json({ error: "Battle not found." }, { status: 404 });
    }

    const battle = battleRows[0];

    if (battle.created_by !== session.userId && battle.opponent_id !== session.userId) {
      return NextResponse.json({ error: "You are not a participant in this battle." }, { status: 403 });
    }
    if (battle.status === "completed") {
      return NextResponse.json({ error: "This battle has already been judged." }, { status: 409 });
    }
    if (!["live", "judging"].includes(battle.status)) {
      return NextResponse.json({ error: "Battle is not ready for judging yet." }, { status: 409 });
    }
    if (!battle.opponent_id) {
      return NextResponse.json({ error: "This battle has no opponent." }, { status: 409 });
    }

    const messageRows = await sql`
      SELECT user_id, content, round, created_at
      FROM battle_messages
      WHERE battle_id = ${id}
      ORDER BY round ASC, created_at ASC
    `;

    const creatorMessages  = messageRows.filter((m) => m.user_id === battle.created_by).map((m) => m.content as string);
    const opponentMessages = messageRows.filter((m) => m.user_id === battle.opponent_id).map((m) => m.content as string);

    if (creatorMessages.length === 0 && opponentMessages.length === 0) {
      return NextResponse.json({ error: "No messages in this battle yet." }, { status: 409 });
    }

    const judgeResult = process.env.OPENAI_API_KEY
      ? await runAiJudge({
          topic: battle.topic, title: battle.title,
          creatorName: battle.creator_username, opponentName: battle.opponent_username,
          creatorMessages, opponentMessages,
        })
      : fallbackJudge({
          creatorMessages, opponentMessages,
          creatorName: battle.creator_username, opponentName: battle.opponent_username,
        });

    const winnerId =
      judgeResult.winner === "creator" ? battle.created_by
      : judgeResult.winner === "opponent" ? battle.opponent_id
      : null;

    const creatorTotal  = judgeResult.scores.creator?.total  ?? 0;
    const opponentTotal = judgeResult.scores.opponent?.total ?? 0;
    const margin = Math.abs(creatorTotal - opponentTotal);
    const winnerName = winnerId === battle.created_by ? battle.creator_username : battle.opponent_username;

    const reasoning = judgeResult.winner === "draw"
      ? `It was too close to call — the scores were within ${margin} points. Both fighters get participation Aura.`
      : `${winnerName} won with a score of ${winnerId === battle.created_by ? creatorTotal : opponentTotal} vs ${winnerId === battle.created_by ? opponentTotal : creatorTotal}. ${judgeResult.summary}`;

    await sql`
      UPDATE battles
      SET status               = 'completed',
          winner_id            = ${winnerId},
          ai_summary           = ${judgeResult.summary},
          ai_winner_reasoning  = ${reasoning},
          ai_scores            = ${JSON.stringify({
            creator:  judgeResult.scores.creator,
            opponent: judgeResult.scores.opponent,
            feedback: judgeResult.feedback,
          })},
          completed_at = now()
      WHERE id = ${id}
    `;

    if (winnerId) {
      const loserId = winnerId === battle.created_by ? battle.opponent_id : battle.created_by;
      const winnerIsDominant = margin >= DOMINANT_MARGIN;
      const winnerAura = winnerIsDominant ? AURA_DOMINANT_WIN : AURA_WIN;
      await applyAuraChange(winnerId, winnerAura, winnerIsDominant ? "Dominant Win 🔥" : "Battle Win ⚔️", "win", id);
      await applyAuraChange(loserId!, AURA_LOSS, "Battle Loss 💀", "loss", id);
      await sql`UPDATE users SET wins = wins + 1, current_streak = current_streak + 1, best_streak = GREATEST(best_streak, current_streak + 1) WHERE id = ${winnerId}`;
      await sql`UPDATE users SET losses = losses + 1, current_streak = 0 WHERE id = ${loserId}`;
    } else {
      await applyAuraChange(battle.created_by, 5, "Battle Draw", "win", id);
      await applyAuraChange(battle.opponent_id!, 5, "Battle Draw", "win", id);
    }

    return NextResponse.json({
      success: true,
      winnerId,
      summary: judgeResult.summary,
      reasoning,
      scores: judgeResult.scores,
      feedback: judgeResult.feedback,
    });
  } catch (err) {
    console.error("AI judge error:", err);
    return NextResponse.json({ error: "Something went wrong while judging." }, { status: 500 });
  }
}

async function applyAuraChange(
  userId: string, amount: number, reason: string, category: string, battleId: string
) {
  await sql`UPDATE users SET aura = GREATEST(aura + ${amount}, 0) WHERE id = ${userId}`;
  await sql`
    INSERT INTO aura_transactions (user_id, amount, reason, category, battle_id)
    VALUES (${userId}, ${amount}, ${reason}, ${category}, ${battleId})
  `;
}

async function runAiJudge(input: {
  topic: string; title: string; creatorName: string; opponentName: string;
  creatorMessages: string[]; opponentMessages: string[];
}): Promise<JudgeResult> {
  const creatorTranscript  = input.creatorMessages.map((m, i) => `Round ${i+1}: ${m}`).join("\n");
  const opponentTranscript = input.opponentMessages.map((m, i) => `Round ${i+1}: ${m}`).join("\n");

  const prompt = `Battle title: ${input.title}\nTopic: ${input.topic}\n\nParticipant A ("creator", username: ${input.creatorName}):\n${creatorTranscript}\n\nParticipant B ("opponent", username: ${input.opponentName}):\n${opponentTranscript}\n\nScore each participant 0-100 on: humor, creativity, originality, topicRelevance, timing, comebackQuality, confidence, wordplay, consistency. Compute "total" as the average rounded to nearest integer.\n\nDetermine winner: "creator", "opponent", or "draw" if totals within 2 points.\n\nRESPOND WITH VALID JSON ONLY:\n{"scores":{"creator":{...all 10 fields...},"opponent":{...}},"winner":"creator","summary":"2-3 sentences","feedback":{"creator":"tip","opponent":"tip"}}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are the AI Judge for Ragebait, a roast battle platform. Score battles on humor, creativity, originality, topicRelevance, timing, comebackQuality, confidence, wordplay, and consistency (0-100 each). Penalize hate speech, threats, racism, body shaming, and harassment heavily in the 'consistency' score. Reward wit, wordplay, and creative comebacks. Respond with valid JSON only — no markdown, no commentary.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

function fallbackJudge(input: {
  creatorMessages: string[]; opponentMessages: string[];
  creatorName: string; opponentName: string;
}): JudgeResult {
  function scoreMessages(messages: string[]): JudgeScore {
    const totalLen = messages.reduce((s, m) => s + m.length, 0);
    const avgLen   = totalLen / Math.max(messages.length, 1);
    const words    = messages.join(" ").toLowerCase().split(/\s+/);
    const variety  = Math.min(100, Math.round((new Set(words).size / Math.max(words.length, 1)) * 150));
    const length   = Math.min(100, Math.round(avgLen / 3));
    const rand = () => Math.floor(Math.random() * 17) - 8;
    const humor         = Math.min(100, Math.max(0, Math.round(length * 0.4 + variety * 0.6) + rand()));
    const creativity    = Math.min(100, Math.max(0, Math.round(variety) + rand()));
    const originality   = Math.min(100, Math.max(0, Math.round(variety * 0.8 + length * 0.2) + rand()));
    const topicRelevance= Math.min(100, Math.max(0, 65 + rand()));
    const timing        = Math.min(100, Math.max(0, 60 + rand()));
    const comebackQuality=Math.min(100, Math.max(0, Math.round(length * 0.5 + variety * 0.5) + rand()));
    const confidence    = Math.min(100, Math.max(0, Math.round(length * 0.7) + rand()));
    const wordplay      = Math.min(100, Math.max(0, Math.round(variety * 0.9) + rand()));
    const consistency   = Math.min(100, Math.max(0, 70 + rand()));
    const total = Math.round((humor+creativity+originality+topicRelevance+timing+comebackQuality+confidence+wordplay+consistency)/9);
    return { humor, creativity, originality, topicRelevance, timing, comebackQuality, confidence, wordplay, consistency, total };
  }

  const creatorScores  = scoreMessages(input.creatorMessages.length ? input.creatorMessages : [""]);
  const opponentScores = scoreMessages(input.opponentMessages.length ? input.opponentMessages : [""]);
  const diff = creatorScores.total - opponentScores.total;
  const winner: "creator" | "opponent" | "draw" = Math.abs(diff) <= 2 ? "draw" : diff > 0 ? "creator" : "opponent";
  const winnerName = winner === "creator" ? input.creatorName : winner === "opponent" ? input.opponentName : null;

  return {
    scores: { creator: creatorScores, opponent: opponentScores },
    winner,
    summary: winner === "draw"
      ? `A razor-close battle between ${input.creatorName} and ${input.opponentName}. Scores were nearly identical — calling it a draw.`
      : `${winnerName} edges the win through stronger variety and creativity. A solid performance.`,
    feedback: {
      creator:  "Vary your vocabulary and stay on-topic for higher scores.",
      opponent: "Vary your vocabulary and stay on-topic for higher scores.",
    },
  };
}
