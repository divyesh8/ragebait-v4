"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import clsx from "clsx";

interface CreateBattleFormProps {
  onCreated?: () => void;
  onClose: () => void;
}

const TOPICS = [
  "Android vs iPhone", "Anime", "Football", "Cricket", "Basketball",
  "Gaming", "Movies", "Technology", "Music", "College Life",
  "Internet Culture", "Food", "Fashion", "Politics", "Science",
  "Books", "Travel", "Fitness", "Startup Life", "Custom",
];

const BATTLE_TYPES = [
  { value: "casual",     label: "Casual",     icon: "😜", desc: "Low stakes, just for fun" },
  { value: "ranked",     label: "Ranked",     icon: "🏆", desc: "Aura on the line" },
  { value: "friend",     label: "Friend",     icon: "🤝", desc: "Invite a specific person" },
  { value: "group",      label: "Group",      icon: "🔥", desc: "Within a Rage Group" },
  { value: "tournament", label: "Tournament", icon: "🎯", desc: "Part of a tournament" },
  { value: "event",      label: "Event",      icon: "⚡", desc: "Special event battle" },
];

const MODES = [
  { value: "text",  label: "Text",  icon: "💬", desc: "Written roasts only" },
  { value: "image", label: "Image", icon: "🖼️", desc: "Images + text" },
  { value: "meme",  label: "Meme",  icon: "🤣", desc: "Meme battle" },
];

export default function CreateBattleForm({ onCreated, onClose }: CreateBattleFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [battleType, setBattleType] = useState("casual");
  const [mode, setMode] = useState("text");
  const [rounds, setRounds] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveTopic = topic === "Custom" ? customTopic.trim() : topic;
  const canProceed1 = effectiveTopic.trim().length > 0;
  const canProceed2 = title.trim().length >= 5;

  async function handleSubmit() {
    if (!canProceed2 || !effectiveTopic) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/battles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          topic: effectiveTopic,
          battle_type: battleType,
          mode,
          rounds,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create battle.");
        setLoading(false);
        return;
      }

      onCreated?.();
      onClose();
      router.push(`/battles/${data.battle.id}`);
    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-void/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-3xl border border-line bg-surface shadow-[0_20px_80px_rgba(0,0,0,0.7)] animate-rise overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-bold">Start a Battle</h2>
            <p className="text-xs text-white/40 mt-0.5">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={clsx(
                "h-1 flex-1 rounded-full transition-all duration-500",
                s <= step ? "bg-aura-gradient shadow-[0_0_8px_rgba(166,91,255,0.5)]" : "bg-white/10"
              )}
            />
          ))}
        </div>

        <div className="px-6 py-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-aura-crimson/30 bg-aura-crimson/10 px-4 py-3 text-sm text-aura-crimson">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Step 1: Topic + type ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                  Choose a topic *
                </label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className={clsx(
                        "rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                        topic === t
                          ? "bg-aura-purple text-void border-aura-purple shadow-glow-sm"
                          : "border-line bg-surface2 text-white/50 hover:border-aura-purple/40 hover:text-white"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {topic === "Custom" && (
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter your custom topic..."
                    maxLength={60}
                    className="input-base mt-3"
                    autoFocus
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Title + format ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                  Battle title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Android camera vs iPhone camera — settle it"
                  maxLength={100}
                  className="input-base"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-white/25">Make it provocative — it's the headline people see</p>
                  <span className="text-xs text-white/25 font-mono">{title.length}/100</span>
                </div>
              </div>

              {/* Battle type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                  Battle type
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BATTLE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setBattleType(t.value)}
                      className={clsx(
                        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                        battleType === t.value
                          ? "border-aura-purple/50 bg-aura-purple/10 shadow-glow-sm"
                          : "border-line bg-surface2 hover:border-aura-purple/30"
                      )}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-xs font-bold">{t.label}</span>
                      <span className="text-[11px] text-white/35 leading-tight">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Mode + rounds + summary ── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Mode */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                  Battle mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MODES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMode(m.value)}
                      className={clsx(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                        mode === m.value
                          ? "border-aura-blue/50 bg-aura-blue/10"
                          : "border-line bg-surface2 hover:border-aura-blue/30"
                      )}
                    >
                      <span className="text-2xl">{m.icon}</span>
                      <span className="text-xs font-bold">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                  Number of rounds: <span className="text-aura-purple">{rounds}</span>
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 5, 7].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRounds(r)}
                      className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold transition-all",
                        rounds === r
                          ? "border-aura-purple bg-aura-purple/15 text-aura-purple"
                          : "border-line bg-surface2 text-white/50 hover:border-aura-purple/40"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-line bg-surface2/60 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Battle summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-white/40">Topic</div>
                  <div className="text-white font-medium truncate">{effectiveTopic}</div>
                  <div className="text-white/40">Type</div>
                  <div className="text-white font-medium capitalize">{battleType}</div>
                  <div className="text-white/40">Mode</div>
                  <div className="text-white font-medium capitalize">{mode}</div>
                  <div className="text-white/40">Rounds</div>
                  <div className="text-white font-medium">{rounds}</div>
                </div>
              </div>

              <div className="text-xs text-white/25 text-center">
                Your battle will be open for anyone to join. AI moderation is always active.
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 border-t border-line px-6 pb-6 pt-4">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)} className="flex-shrink-0">
              ← Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              fullWidth
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !canProceed1 : !canProceed2}
            >
              Continue →
            </Button>
          ) : (
            <Button
              fullWidth
              loading={loading}
              onClick={handleSubmit}
              disabled={!canProceed2 || !effectiveTopic}
              icon={<span>⚔️</span>}
            >
              {loading ? "Creating..." : "Start the battle"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
