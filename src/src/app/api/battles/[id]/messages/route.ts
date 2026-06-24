import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { moderateBattleMessage } from "@/lib/moderation";
import { z } from "zod";

const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(500, "Message cannot exceed 500 characters."),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const { content } = parsed.data;

  // Moderation check first
  const modResult = await moderateBattleMessage(content);
  if (!modResult.allowed) {
    return NextResponse.json(
      {
        error: modResult.reason ?? "This message was blocked by AI moderation.",
        moderated: true,
      },
      { status: 422 }
    );
  }

  try {
    const battleRows = await sql`
      SELECT id, created_by, opponent_id, status, rounds, current_round
      FROM battles WHERE id = ${id} LIMIT 1
    `;

    if (battleRows.length === 0) {
      return NextResponse.json({ error: "Battle not found." }, { status: 404 });
    }

    const battle = battleRows[0];

    if (battle.status !== "live") {
      return NextResponse.json({ error: "This battle is not currently live." }, { status: 409 });
    }
    if (battle.created_by !== session.userId && battle.opponent_id !== session.userId) {
      return NextResponse.json({ error: "You are not a participant in this battle." }, { status: 403 });
    }

    // Count this user's existing messages
    const countRows = await sql`
      SELECT COUNT(*)::int AS count FROM battle_messages
      WHERE battle_id = ${id} AND user_id = ${session.userId}
    `;
    const myCount = countRows[0]?.count ?? 0;
    const round = myCount + 1;

    if (round > battle.rounds) {
      return NextResponse.json(
        { error: `You've already posted all ${battle.rounds} round(s) for this battle.` },
        { status: 409 }
      );
    }

    const inserted = await sql`
      INSERT INTO battle_messages (battle_id, user_id, content, round)
      VALUES (${id}, ${session.userId}, ${content}, ${round})
      RETURNING id, content, round, created_at
    `;

    // Update current_round tracker
    await sql`
      UPDATE battles SET current_round = GREATEST(current_round, ${round}) WHERE id = ${id}
    `;

    // Check if both participants have posted all rounds
    const totalsRows = await sql`
      SELECT user_id, COUNT(*)::int AS count
      FROM battle_messages WHERE battle_id = ${id}
      GROUP BY user_id
    `;

    const creatorCount  = totalsRows.find((r) => r.user_id === battle.created_by)?.count  ?? 0;
    const opponentCount = battle.opponent_id
      ? totalsRows.find((r) => r.user_id === battle.opponent_id)?.count ?? 0
      : 0;

    let readyForJudging = false;
    if (battle.opponent_id && creatorCount >= battle.rounds && opponentCount >= battle.rounds) {
      await sql`UPDATE battles SET status = 'judging' WHERE id = ${id} AND status = 'live'`;
      readyForJudging = true;
    }

    return NextResponse.json({ message: inserted[0], readyForJudging });
  } catch (err) {
    console.error("Post battle message error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
