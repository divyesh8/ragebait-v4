import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") ?? "all";

  try {
    let rows;

    if (period === "week") {
      rows = await sql`
        SELECT u.id AS user_id, u.username, u.avatar_url,
               COALESCE(SUM(CASE WHEN at.amount > 0 THEN at.amount ELSE 0 END), 0)::int AS aura,
               u.wins, u.losses
        FROM users u
        LEFT JOIN aura_transactions at ON at.user_id = u.id
          AND at.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY u.id, u.username, u.avatar_url, u.wins, u.losses
        ORDER BY aura DESC, u.wins DESC
        LIMIT 50
      `;
    } else if (period === "month") {
      rows = await sql`
        SELECT u.id AS user_id, u.username, u.avatar_url,
               COALESCE(SUM(CASE WHEN at.amount > 0 THEN at.amount ELSE 0 END), 0)::int AS aura,
               u.wins, u.losses
        FROM users u
        LEFT JOIN aura_transactions at ON at.user_id = u.id
          AND at.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY u.id, u.username, u.avatar_url, u.wins, u.losses
        ORDER BY aura DESC, u.wins DESC
        LIMIT 50
      `;
    } else {
      rows = await sql`
        SELECT id AS user_id, username, avatar_url, aura, wins, losses
        FROM users
        ORDER BY aura DESC, wins DESC
        LIMIT 50
      `;
    }

    const leaderboard = rows.map((row, index) => {
      const total = (row.wins ?? 0) + (row.losses ?? 0);
      const winRate = total > 0 ? Math.round(((row.wins ?? 0) / total) * 100) : 0;
      return {
        rank: index + 1,
        userId: row.user_id,
        username: row.username,
        avatarUrl: row.avatar_url,
        aura: Number(row.aura),
        wins: row.wins ?? 0,
        losses: row.losses ?? 0,
        totalBattles: total,
        winRate,
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
