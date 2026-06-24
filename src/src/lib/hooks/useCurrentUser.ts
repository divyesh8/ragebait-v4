"use client";

import { useEffect, useState, useCallback } from "react";

export interface CurrentUser {
  id: string;
  username: string;
  display_name: string | null;
  email: string;
  aura: number;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  current_streak: number;
  best_streak: number;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  is_admin: boolean;
  created_at: string;
}

let cachedUser: CurrentUser | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);
  const [loading, setLoading] = useState(cachedUser === null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      const u = data.user ?? null;
      cachedUser = u;
      cacheTimestamp = Date.now();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Use cache if fresh enough
    if (cachedUser !== null && Date.now() - cacheTimestamp < CACHE_TTL) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh]);

  return { user, loading, refresh };
}
