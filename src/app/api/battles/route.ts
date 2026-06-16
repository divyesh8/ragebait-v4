import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { z } from "zod";

const createBattleSchema = z.object({
  title: z.string().min(3).max(140),
  topic: z.string().min(1).max(60),
  battleType: z.enum(["casual", "ranked", "friend", "tournament", "group", "event"]).default("casual"),
  mode: z.enum(["text", "image", "meme"]).default("text"),
  rounds: z.number().int().min(1).max(10).default(3),
});

// GET /api/battles?status=open|live|completed
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");

  try {
    const rows = status
      ? await sql`
          SELECT
            b.id, b.title, b.topic, b.battle_type, b.mode, b.status,
            b.rounds, b.winner_id, b.ai_summary, b.created_at, b.started_at, b.completed_at,
            creator.id AS creator_id, creator.username AS creator_username, creator.avatar_url AS creator_avatar,
            opponent.id AS opponent_id, opponent.username AS opponent_username, opponent.avatar_url AS opponent_avatar
          FROM battles b
          JOIN users creator ON creator.id = b.created_by
          LEFT JOIN users opponent ON opponent.id = b.opponent_id
          WHERE b.status = ${status}
          ORDER BY b.created_at DESC
          LIMIT 50
        `
      : await sql`
          SELECT
            b.id, b.title, b.topic, b.battle_type, b.mode, b.status,
            b.rounds, b.winner_id, b.ai_summary, b.created_at, b.started_at, b.completed_at,
            creator.id AS creator_id, creator.username AS creator_username, creator.avatar_url AS creator_avatar,
            opponent.id AS opponent_id, opponent.username AS opponent_username, opponent.avatar_url AS opponent_avatar
          FROM battles b
          JOIN users creator ON creator.id = b.created_by
          LEFT JOIN users opponent ON opponent.id = b.opponent_id
          ORDER BY b.created_at DESC
          LIMIT 50
        `;

    return NextResponse.json({ battles: rows });
  } catch (err) {
    console.error("List battles error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// POST /api/battles  — create a new open battle (waiting for an opponent)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createBattleSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json({ error: firstError?.message ?? "Invalid input." }, { status: 400 });
  }

  const { title, topic, battleType, mode, rounds } = parsed.data;

  try {
    const rows = await sql`
      INSERT INTO battles (title, topic, battle_type, mode, status, created_by, rounds)
      VALUES (${title}, ${topic}, ${battleType}, ${mode}, 'open', ${session.userId}, ${rounds})
      RETURNING id, title, topic, battle_type, mode, status, rounds, created_at
    `;

    return NextResponse.json({ battle: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("Create battle error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
