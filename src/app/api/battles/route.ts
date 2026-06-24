import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { z } from "zod";

const createBattleSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(140),
  topic: z.string().min(1, "Topic is required.").max(60),
  // Accept both snake_case (from form) and camelCase
  battle_type: z.enum(["casual", "ranked", "friend", "tournament", "group", "event"]).default("casual").optional(),
  battleType:  z.enum(["casual", "ranked", "friend", "tournament", "group", "event"]).default("casual").optional(),
  mode: z.enum(["text", "image", "meme"]).default("text"),
  rounds: z.number().int().min(1).max(10).default(3),
});

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const topic  = req.nextUrl.searchParams.get("topic");

  try {
    const rows = await sql`
      SELECT
        b.id, b.title, b.topic, b.battle_type, b.mode, b.status,
        b.rounds, b.winner_id, b.ai_summary, b.created_at,
        creator.id         AS creator_id,
        creator.username   AS creator_username,
        creator.avatar_url AS creator_avatar,
        opponent.id        AS opponent_id,
        opponent.username  AS opponent_username,
        opponent.avatar_url AS opponent_avatar
      FROM battles b
      JOIN users creator ON creator.id = b.created_by
      LEFT JOIN users opponent ON opponent.id = b.opponent_id
      WHERE
        (${status}::text IS NULL OR b.status = ${status})
        AND (${topic}::text IS NULL OR b.topic = ${topic})
      ORDER BY
        CASE b.status
          WHEN 'live'      THEN 1
          WHEN 'open'      THEN 2
          WHEN 'judging'   THEN 3
          WHEN 'completed' THEN 4
          ELSE 5
        END,
        b.created_at DESC
      LIMIT 60
    `;

    return NextResponse.json({ battles: rows });
  } catch (err) {
    console.error("List battles error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const parsed = createBattleSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json({ error: firstError?.message ?? "Invalid input." }, { status: 400 });
  }

  const { title, topic, mode, rounds } = parsed.data;
  // Accept either casing
  const battleType = parsed.data.battle_type ?? parsed.data.battleType ?? "casual";

  try {
    const rows = await sql`
      INSERT INTO battles (title, topic, battle_type, mode, status, created_by, rounds, current_round)
      VALUES (${title}, ${topic}, ${battleType}, ${mode}, 'open', ${session.userId}, ${rounds}, 0)
      RETURNING id, title, topic, battle_type, mode, status, rounds, created_at
    `;

    return NextResponse.json({ battle: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Create battle error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
