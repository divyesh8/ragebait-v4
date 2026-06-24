import SignupForm from "@/components/auth/SignupForm";
import Link from "next/link";

export const metadata = { title: "Sign Up — Ragebait" };

export default function SignupPage() {
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
          <h1 className="mt-5 font-display text-2xl font-bold">Join the arena</h1>
          <p className="mt-2 text-sm text-white/40">
            Create your profile. Start with 0 Aura. Build from there.
          </p>
        </div>

        {/* Perks */}
        <div className="mb-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "⚖️", label: "AI-judged battles" },
            { icon: "💜", label: "Real Aura economy" },
            { icon: "🛡️", label: "Safe platform" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-line bg-surface2/50 px-2 py-3"
            >
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-[11px] text-white/40 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-3xl border border-line bg-surface px-6 py-8 shadow-[0_8px_48px_rgba(0,0,0,0.5)]">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
