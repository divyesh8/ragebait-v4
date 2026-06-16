"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

interface RageGroup {
  id: string;
  name: string;
  description: string;
  banner_url: string;
  topics: string[];
  creator_username: string | null;
  member_count: number;
  is_member: boolean;
  created_at: string;
}

const emptyForm = {
  name: "",
  description: "",
  topics: "",
};

function topicList(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean)
    )
  );
}

export default function GroupsPage() {
  const { user } = useCurrentUser();
  const [groups, setGroups] = useState<RageGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyGroupId, setBusyGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadGroups() {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(data.groups ?? []);
    } catch {
      setGroups([]);
      setError("Could not load groups.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("Log in to create a group.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          topics: topicList(form.topics),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not create group.");
        setSaving(false);
        return;
      }

      setGroups((current) => [data.group, ...current]);
      setForm(emptyForm);
      setShowCreate(false);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleMembership(group: RageGroup) {
    if (!user) {
      setError("Log in to join a group.");
      return;
    }

    setBusyGroupId(group.id);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${group.id}/membership`, {
        method: group.is_member ? "DELETE" : "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not update membership.");
        setBusyGroupId(null);
        return;
      }

      setGroups((current) =>
        current.map((item) =>
          item.id === group.id
            ? {
                ...item,
                is_member: data.is_member,
                member_count: data.member_count,
              }
            : item
        )
      );
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusyGroupId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Rage Groups</h1>
          <p className="mt-2 text-white/50">
            Communities built around topics. Join a group, start battles, and climb together.
          </p>
        </div>
        {user ? (
          <Button size="md" onClick={() => setShowCreate(true)}>
            + Create group
          </Button>
        ) : (
          <Link href="/login">
            <Button size="md" variant="secondary">
              Log in to create
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-aura-crimson/40 bg-aura-crimson/10 px-4 py-3 text-sm text-aura-crimson">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/50">Loading groups...</p>
      ) : groups.length === 0 ? (
        <Card className="text-center">
          <p className="text-white/60">No groups yet. Create the first community.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex flex-col gap-4">
              {group.banner_url ? (
                <img
                  src={group.banner_url}
                  alt=""
                  className="h-24 rounded-xl object-cover"
                />
              ) : (
                <div className="h-24 rounded-xl bg-aura-gradient" />
              )}
              <div>
                <h3 className="font-display text-lg font-semibold">{group.name}</h3>
                <p className="mt-1 text-sm text-white/50">{group.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-aura-purple"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between text-xs text-white/40">
                <span>{group.member_count.toLocaleString()} members</span>
                {group.creator_username && <span>by {group.creator_username}</span>}
              </div>
              <Button
                variant={group.is_member ? "ghost" : "secondary"}
                size="sm"
                className="w-full"
                onClick={() => toggleMembership(group)}
                disabled={busyGroupId === group.id}
              >
                {busyGroupId === group.id
                  ? "Updating..."
                  : group.is_member
                  ? "Leave group"
                  : "Join group"}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <Card className="w-full max-w-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Create group</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-white/40 hover:text-white"
                aria-label="Close"
              >
                X
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreate}>
              <div>
                <label htmlFor="group-name" className="block text-sm font-medium text-white/70">
                  Group name
                </label>
                <input
                  id="group-name"
                  type="text"
                  required
                  minLength={3}
                  maxLength={60}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:border-aura-purple"
                  placeholder="Anime Debate Arena"
                />
              </div>

              <div>
                <label htmlFor="group-description" className="block text-sm font-medium text-white/70">
                  Description
                </label>
                <textarea
                  id="group-description"
                  required
                  minLength={10}
                  maxLength={280}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  className="mt-1.5 min-h-24 w-full resize-none rounded-xl border border-line bg-surface2 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:border-aura-purple"
                  placeholder="What kind of battles belongs here?"
                />
              </div>

              <div>
                <label htmlFor="group-topics" className="block text-sm font-medium text-white/70">
                  Topics
                </label>
                <input
                  id="group-topics"
                  type="text"
                  required
                  value={form.topics}
                  onChange={(e) => update("topics", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-sm text-white placeholder:text-white/30 focus-visible:border-aura-purple"
                  placeholder="Anime, Internet Culture"
                />
                <p className="mt-1 text-xs text-white/30">Separate topics with commas.</p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={saving}>
                {saving ? "Creating..." : "Create group"}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
