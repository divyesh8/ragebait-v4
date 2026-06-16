import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET /api/battles/:id — full battle detail including messages
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const battleRows = await sql`
      SELECT
        b.id, b.title, b.topic, b.battle_type, b.mode, b.status,
        b.rounds, b.winner_id, b.ai_summary, b.ai_scores,
        b.created_at, b.started_at, b.completed_at,
        creator.id AS creator_id, creator.username AS creator_username, creator.avatar_url AS creator_avatar,
        opponent.id AS opponent_id, opponent.username AS opponent_username, opponent.avatar_url AS opponent_avatar
      FROM battles b
      JOIN users creator ON creator.id = b.created_by
      LEFT JOIN users opponent ON opponent.id = b.opponent_id
      WHERE b.id = ${id}
      LIMIT 1
    `;

    if (battleRows.length === 0) {
      return NextResponse.json({ error: "Battle not found." }, { status: 404 });
    }

    const messageRows = await sql`
      SELECT m.id, m.content, m.round, m.created_at,
             u.id AS user_id, u.username, u.avatar_url
      FROM battle_messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.battle_id = ${id}
      ORDER BY m.created_at ASC
    `;

    return NextResponse.json({ battle: battleRows[0], messages: messageRows });
  } catch (err) {
    console.error("Get battle error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
