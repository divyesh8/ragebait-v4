import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  // Don't throw at import time during build — only when actually queried,
  // so the app can still build without env vars set.
  console.warn("DATABASE_URL is not set. Auth routes will fail until it is configured.");
}

export const sql = neon(process.env.DATABASE_URL ?? "");
