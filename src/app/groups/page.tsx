"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import clsx from "clsx";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  banner_url: string | null;
  member_count: number;
  battle_count: number;
  is_private: boolean;
  creator_username: string;
  created_at: string;
  is_member?: boolean;
}

const accentColors = [
  "from-aura-purple/20 to-aura-blue/10",
  "from-aura-crimson/20 to-aura-purple/10",
  "from-aura-blue/20 to-aura-green/10",
  "from-aura-gold/20 to-aura-crimson/10",
];

function groupAvatar(name: string, avatarUrl: string | null) {
  return avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=1a0a3e`;
}

export default function GroupsPage() {
  const { user } = useCurrentUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleJoin(groupId: string) {
    if (!user) { setError("Log in to join a group."); return; }
    setJoiningId(groupId);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/membership`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not join."); setJoiningId(null); return; }
      setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, is_member: true, member_count: g.member_count + 1 } : g));
    } catch {
      setError("Could not reach server.");
    }
    setJoiningId(null);
  }

  async function handleLeave(groupId: string) {
    if (!user) return;
    setJoiningId(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}/membership`, { method: "DELETE" });
      if (res.ok) {
        setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, is_member: false, member_count: Math.max(0, g.member_count - 1) } : g));
      }
    } catch {}
    setJoiningId(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not create group."); setCreating(false); return; }
      setGroups((prev) => [{ ...data.group, is_member: true }, ...prev]);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
    } catch {
      setError("Could not reach server.");
    }
    setCreating(false);
  }

  const filtered = groups.filter(
    (g) =>
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Rage Groups</h1>
          <p className="mt-2 text-sm text-white/40">
            Join communities, run group battles, and climb the group leaderboard.
          </p>
        </div>
        {user ? (
          <Button onClick={() => setShowCreate(true)} icon={<span>🔥</span>}>
            Create group
          </Button>
        ) : (
          <Link href="/login">
            <Button variant="secondary">Log in to create</Button>
          </Link>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-aura-crimson/30 bg-aura-crimson/10 px-5 py-4 text-sm text-aura-crimson">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Create group modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <Card className="relative w-full max-w-md z-10 animate-rise" variant="elevated" padding="lg">
            <h2 className="font-display text-xl font-bold mb-6">Create a Rage Group</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Group name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Cricket Roasters"
                  maxLength={50}
                  required
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What's this group about?"
                  maxLength={200}
                  rows={3}
                  className="input-base resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={creating} fullWidth>
                  Create group
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreate(false)}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="input-base pl-10 text-xs"
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔥"
          title={search ? "No groups match your search" : "No groups yet"}
          description={search ? "Try different keywords." : "Be the first to create a rage group."}
          action={user ? (
            <Button onClick={() => setShowCreate(true)}>Create a group</Button>
          ) : (
            <Link href="/signup"><Button>Join to create</Button></Link>
          )}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group, i) => (
            <Card key={group.id} className="flex flex-col gap-4 group overflow-hidden" padding="none">
              {/* Banner */}
              <div className={clsx(
                "h-20 relative overflow-hidden bg-gradient-to-br",
                accentColors[i % accentColors.length]
              )}>
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                {group.is_private && (
                  <span className="absolute top-2 right-2 rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] text-white/60">
                    🔒 Private
                  </span>
                )}
              </div>

              <div className="px-5 pb-5 -mt-6">
                {/* Avatar */}
                <img
                  src={groupAvatar(group.name, group.avatar_url)}
                  alt={group.name}
                  className="h-12 w-12 rounded-xl border-2 border-surface bg-surface2 mb-3"
                />

                <h3 className="font-display font-bold text-base group-hover:text-aura-purple transition-colors">
                  {group.name}
                </h3>
                {group.description && (
                  <p className="mt-1 text-xs text-white/45 line-clamp-2 leading-relaxed">
                    {group.description}
                  </p>
                )}

                {/* Stats */}
                <div className="mt-3 flex items-center gap-3 text-xs text-white/35">
                  <span className="flex items-center gap-1">
                    <span>👥</span>
                    <span className="font-medium text-white/50">{group.member_count.toLocaleString()}</span> members
                  </span>
                  <span className="h-3 w-px bg-line" />
                  <span className="flex items-center gap-1">
                    <span>⚔️</span>
                    <span className="font-medium text-white/50">{group.battle_count}</span> battles
                  </span>
                </div>

                {/* Join / leave */}
                <div className="mt-4">
                  {group.is_member ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      loading={joiningId === group.id}
                      onClick={() => handleLeave(group.id)}
                    >
                      ✓ Joined
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      fullWidth
                      loading={joiningId === group.id}
                      onClick={() => handleJoin(group.id)}
                    >
                      Join group
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
