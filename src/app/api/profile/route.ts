import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { z } from "zod";

const profileUpdateSchema = z.object({
  bio: z.string().max(300, "Bio must be at most 300 characters.").optional().default(""),
  display_name: z.string().max(50).optional().default(""),
  avatar_url: z.string().url().optional().or(z.literal("")).default(""),
});

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json({ error: firstError?.message ?? "Invalid input." }, { status: 400 });
  }

  const { bio, display_name, avatar_url } = parsed.data;

  try {
    const rows = await sql`
      UPDATE users
      SET
        bio = ${bio},
        display_name = NULLIF(${display_name}, ''),
        avatar_url   = NULLIF(${avatar_url}, ''),
        updated_at   = now()
      WHERE id = ${session.userId}
      RETURNING id, username, email, display_name, aura, level, xp, wins, losses,
                current_streak, best_streak, bio, avatar_url, created_at
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0] });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
