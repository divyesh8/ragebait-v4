"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import clsx from "clsx";

export default function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid credentials. Try again.");
        setLoading(false);
        return;
      }

      router.push("/battles");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-aura-crimson/30 bg-aura-crimson/10 px-4 py-3 text-sm text-aura-crimson animate-rise">
          <span className="flex-shrink-0 mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Username or email */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
          Username or Email
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="@username or email"
          required
          autoComplete="username"
          autoFocus
          className="input-base"
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Password</label>
          <Link
            href="/forgot-password"
            className="text-xs text-aura-blue hover:text-white transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            autoComplete="current-password"
            className="input-base pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs"
          >
            {showPass ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
        {loading ? "Logging in..." : "Log in"}
      </Button>

      <p className="text-center text-xs text-white/30">
        Don't have an account?{" "}
        <Link href="/signup" className="text-aura-blue hover:text-white transition-colors font-medium">
          Sign up free
        </Link>
      </p>
    </form>
  );
}
