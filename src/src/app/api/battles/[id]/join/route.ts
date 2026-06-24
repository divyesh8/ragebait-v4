import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

// POST /api/battles/:id/join — join an open battle as the opponent
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
    const rows = await sql`
      SELECT id, created_by, opponent_id, status FROM battles WHERE id = ${id} LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Battle not found." }, { status: 404 });
    }

    const battle = rows[0];

    if (battle.status !== "open") {
      return NextResponse.json({ error: "This battle is no longer open to join." }, { status: 409 });
    }

    if (battle.created_by === session.userId) {
      return NextResponse.json({ error: "You can't join your own battle." }, { status: 400 });
    }

    if (battle.opponent_id) {
      return NextResponse.json({ error: "This battle already has an opponent." }, { status: 409 });
    }

    const updated = await sql`
      UPDATE battles
      SET opponent_id = ${session.userId}, status = 'live', started_at = now()
      WHERE id = ${id} AND status = 'open'
      RETURNING id, status
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "This battle is no longer open to join." }, { status: 409 });
    }

    return NextResponse.json({ success: true, battle: updated[0] });
  } catch (err) {
    console.error("Join battle error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
