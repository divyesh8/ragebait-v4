import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { AUTH_COOKIE_NAME, signSession } from "@/lib/auth";
import { z } from "zod";

// Simplified signup schema — no dob or confirmPassword required from client
const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must be at most 20 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/[0-9]/, "Password must contain a number."),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues.map((i) => ({
      field: String(i.path[0] ?? ""),
      message: i.message,
    }));
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input.", fieldErrors },
      { status: 400 }
    );
  }

  const { username, email, password } = parsed.data;

  try {
    // Check uniqueness
    const existing = await sql`
      SELECT id FROM users
      WHERE LOWER(username) = LOWER(${username}) OR LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username or email is already taken.", fieldErrors: [{ field: "username", message: "Already taken." }] },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const rows = await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES (${username}, ${email}, ${passwordHash})
      RETURNING id, username
    `;

    const user = rows[0];
    const token = await signSession({ userId: user.id, username: user.username });

    // Grant signup Aura bonus
    await sql`
      INSERT INTO aura_transactions (user_id, amount, reason, category)
      VALUES (${user.id}, 10, 'Welcome to Ragebait!', 'bonus')
    `;
    await sql`UPDATE users SET aura = 10 WHERE id = ${user.id}`;

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
    });

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
