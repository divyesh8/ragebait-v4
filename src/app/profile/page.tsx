"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import AuraBadge from "@/components/ui/AuraBadge";
import Button from "@/components/ui/Button";
import { type CurrentUser, useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useEffect, useState } from "react";

interface AuraTransaction {
  id: string;
  amount: number;
  reason: string;
  battle_id: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { user, loading } = useCurrentUser();
  const [profile, setProfile] = useState<CurrentUser | null>(null);
  const [history, setHistory] = useState<AuraTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    setProfile(user);
    setBio(user.bio);
    setAvatarUrl(user.avatar_url);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setHistoryLoading(false);
      return;
    }
    fetch("/api/aura/history")
      .then((res) => res.json())
      .then((data) => setHistory(data.transactions ?? []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [user]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, avatarUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not update profile.");
        setSaving(false);
        return;
      }

      setProfile(data.user);
      setEditing(false);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12 text-center text-white/50">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">You're not logged in</h1>
        <p className="mt-2 text-white/50">
          Log in or create an account to see your Aura, stats, and battle history.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/login">
            <Button size="md">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="md" variant="secondary">
              Sign up
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalBattles = profile.wins + profile.losses;
  const winRate = totalBattles > 0 ? Math.round((profile.wins / totalBattles) * 100) : 0;

  const statItems = [
    { label: "Level", value: profile.level },
    { label: "XP", value: profile.xp.toLocaleString() },
    { label: "Wins", value: profile.wins },
    { label: "Losses", value: profile.losses },
    { label: "Win Rate", value: `${winRate}%` },
    { label: "Total Battles", value: totalBattles },
    { label: "Current Streak", value: profile.current_streak },
    { label: "Best Streak", value: profile.best_streak },
  ];

  const displayAvatarUrl =
    profile.avatar_url || `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(profile.username)}`;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="relative h-40 rounded-2xl bg-aura-gradient sm:h-56" />

      <div className="relative -mt-12 flex flex-col items-start gap-4 px-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-4">
          <img
            src={displayAvatarUrl}
            alt={profile.username}
            className="h-24 w-24 rounded-2xl border-4 border-void bg-surface2 sm:h-28 sm:w-28"
          />
          <div className="pb-2">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              {profile.username}
            </h1>
            <p className="text-sm text-white/40">
              Joined{" "}
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            Edit profile
          </Button>
          <Link href="/battles">
            <Button size="sm">+ Start a battle</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-aura-crimson/40 bg-aura-crimson/10 px-4 py-3 text-sm text-aura-crimson">
          {error}
        </div>
      )}

      <p className="mt-6 max-w-2xl text-white/60">
        {profile.bio || "No bio yet."}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <AuraBadge value={profile.aura} size="lg" trend="neutral" />
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statItems.map((item) => (
          <Card key={item.label} className="text-center">
            <p className="font-display text-2xl font-bold text-gradient">{item.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-white/40">{item.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 mb-12">
        <h2 className="font-display text-xl font-bold">Aura history</h2>
        {historyLoading ? (
          <p className="mt-4 text-sm text-white/40">Loading...</p>
        ) : history.length === 0 ? (
          <Card className="mt-4">
            <p className="text-sm text-white/50">
              No Aura transactions yet. Win or lose a battle to start building your history.
            </p>
          </Card>
        ) : (
          <Card className="mt-4 divide-y divide-line p-0">
            {history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium">{tx.reason}</p>
                  <p className="text-xs text-white/40">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm font-semibold ${
                    tx.amount > 0 ? "text-aura-blue" : "text-aura-crimson"
                  }`}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <Card className="w-full max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Edit profile</h2>
              <button
                onClick={() => setEditing(false)}
                className="text-white/40 hover:text-white"
                aria-label="Close"
              >
                X
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleProfileSave}>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-white/70">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  maxLength={280}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1.5 min-h-28 w-full resize-none rounded-xl border border-line bg-surface2 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:border-aura-purple"
                  placeholder="What should people know before they battle you?"
                />
              </div>

              <div>
                <label htmlFor="avatar-url" className="block text-sm font-medium text-white/70">
                  Avatar URL
                </label>
                <input
                  id="avatar-url"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:border-aura-purple"
                  placeholder="https://example.com/avatar.png"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
