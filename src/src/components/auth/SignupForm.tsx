"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import clsx from "clsx";

interface FieldError { field: string; message: string; }

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["", "bg-aura-crimson", "bg-aura-gold", "bg-aura-blue", "bg-aura-green"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={clsx(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i <= score ? colors[score] : "bg-white/10"
            )}
          />
        ))}
        {password && <span className="text-xs ml-2 text-white/40">{labels[score]}</span>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map((c) => (
          <span key={c.label} className={clsx("flex items-center gap-1 text-[11px]", c.pass ? "text-aura-green" : "text-white/30")}>
            <span>{c.pass ? "✓" : "○"}</span> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  function getFieldError(field: string) {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors([]);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) { setFieldErrors(data.fieldErrors); }
        else { setError(data.error ?? "Signup failed. Try again."); }
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

      {/* Username */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
          Username *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="your_username"
            required
            minLength={3}
            maxLength={20}
            autoComplete="username"
            className={clsx(
              "input-base pl-8",
              getFieldError("username") && "border-aura-crimson/60 focus:border-aura-crimson"
            )}
          />
        </div>
        {getFieldError("username") ? (
          <p className="mt-1.5 text-xs text-aura-crimson">{getFieldError("username")}</p>
        ) : (
          <p className="mt-1.5 text-xs text-white/25">3–20 chars, letters/numbers/underscores only</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className={clsx(
            "input-base",
            getFieldError("email") && "border-aura-crimson/60 focus:border-aura-crimson"
          )}
        />
        {getFieldError("email") && (
          <p className="mt-1.5 text-xs text-aura-crimson">{getFieldError("email")}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
          Password *
        </label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            required
            minLength={8}
            autoComplete="new-password"
            className={clsx(
              "input-base pr-12",
              getFieldError("password") && "border-aura-crimson/60 focus:border-aura-crimson"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs"
          >
            {showPass ? "Hide" : "Show"}
          </button>
        </div>
        {getFieldError("password") ? (
          <p className="mt-1.5 text-xs text-aura-crimson">{getFieldError("password")}</p>
        ) : (
          <PasswordStrength password={password} />
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        loading={loading}
        fullWidth
        size="lg"
        className="mt-2"
      >
        {loading ? "Creating your profile..." : "Create my profile"}
      </Button>

      <p className="text-center text-xs text-white/30">
        Already have an account?{" "}
        <Link href="/login" className="text-aura-blue hover:text-white transition-colors font-medium">
          Log in
        </Link>
      </p>

      <p className="text-center text-[11px] text-white/20 leading-relaxed">
        By creating an account you agree to our community rules.
        <br />Hate speech, harassment, and threats will result in permanent bans.
      </p>
    </form>
  );
}
