import Link from "next/link";

const columns = [
  {
    title: "Platform",
    links: [
      { href: "/battles",     label: "Roast Battles" },
      { href: "/leaderboard", label: "Leaderboards" },
      { href: "/groups",      label: "Rage Groups" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login",   label: "Log in" },
      { href: "/signup",  label: "Sign up" },
      { href: "/profile", label: "Profile" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "#", label: "Code of Conduct" },
      { href: "#", label: "AI Moderation Policy" },
      { href: "#", label: "Report a Problem" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-aura-gradient text-void text-sm font-black shadow-glow-sm">
                R
              </span>
              <p className="font-display text-lg font-bold">
                RAGE<span className="text-gradient">BAIT</span>
              </p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/40">
              Win the roast. Claim the Aura. A competitive platform for humor,
              wit, and creativity — kept fair by AI moderation.
            </p>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-aura-green" />
              <span className="text-xs text-white/30">All systems operational</span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/40 transition hover:text-aura-blue"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Ragebait. All Aura earned, none for sale.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-aura-purple/20 bg-aura-purple/5 px-3 py-1 text-xs text-aura-purple/70">
              <span className="h-1 w-1 rounded-full bg-aura-purple" />
              AI-judged fair play
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
