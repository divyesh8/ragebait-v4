import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";

export const metadata = { title: "Log In — Ragebait" };

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-void" />
        <div className="absolute inset-0 bg-hero-glow" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "linear-gradient(rgba(166,91,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(166,91,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-aura-purple/8 blur-[120px]" />
      </div>

      <div className="w-full max-w-md animate-rise">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-aura-gradient text-void text-base font-black shadow-glow">
              R
            </span>
            RAGE<span className="text-gradient">BAIT</span>
          </Link>
          <h1 className="mt-5 font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-white/40">Log in to your account and get back in the arena.</p>
        </div>

        {/* Form card */}
        <div className="rounded-3xl border border-line bg-surface px-6 py-8 shadow-[0_8px_48px_rgba(0,0,0,0.5)]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
