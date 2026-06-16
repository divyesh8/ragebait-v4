"use client";

import { useEffect, useState } from "react";

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  aura: number;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  current_streak: number;
  best_streak: number;
  bio: string;
  avatar_url: string;
  created_at: string;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}
