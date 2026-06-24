import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(60),
  description: z.string().max(300).optional().default(""),
  // topics optional — default to empty array so form doesn't need to send it
  topics: z.array(z.string()).optional().default([]),
  banner_url: z.string().optional().default(""),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  try {
    const userId = session?.userId ?? null;

    const rows = await sql`
      SELECT
        g.id,
        g.name,
        g.description,
        g.avatar_url,
        g.banner_url,
        g.is_private,
        g.created_at,
        creator.username AS creator_username,
        (SELECT COUNT(*)::int FROM group_members gm WHERE gm.group_id = g.id) AS member_count,
        (SELECT COUNT(*)::int FROM battles b WHERE b.group_id = g.id) AS battle_count,
        ${userId
          ? sql`EXISTS (SELECT 1 FROM group_members mine WHERE mine.group_id = g.id AND mine.user_id = ${userId})`
          : sql`false`
        } AS is_member
      FROM rage_groups g
      LEFT JOIN users creator ON creator.id = g.created_by
      ORDER BY member_count DESC, g.created_at DESC
      LIMIT 60
    `;

    return NextResponse.json({ groups: rows });
  } catch (err) {
    console.error("List groups error:", err);
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

  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json({ error: firstError?.message ?? "Invalid input." }, { status: 400 });
  }

  const { name, description, topics, banner_url } = parsed.data;

  try {
    const groupRows = await sql`
      INSERT INTO rage_groups (name, description, banner_url, topics, created_by)
      VALUES (${name}, ${description}, ${banner_url}, ${JSON.stringify(topics)}, ${session.userId})
      RETURNING id, name, description, avatar_url, banner_url, is_private, created_at
    `;

    const group = groupRows[0];

    await sql`
      INSERT INTO group_members (group_id, user_id, role)
      VALUES (${group.id}, ${session.userId}, 'owner')
      ON CONFLICT (group_id, user_id) DO NOTHING
    `;

    return NextResponse.json(
      {
        group: {
          ...group,
          creator_username: session.username,
          member_count: 1,
          battle_count: 0,
          is_member: true,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.code === "23505") {
      return NextResponse.json({ error: "A group with that name already exists." }, { status: 409 });
    }
    console.error("Create group error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
