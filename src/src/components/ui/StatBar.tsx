import clsx from "clsx";

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: "purple" | "blue" | "crimson" | "gold" | "green";
  showValue?: boolean;
  size?: "sm" | "md";
}

export default function StatBar({
  label,
  value,
  max = 100,
  color = "purple",
  showValue = true,
  size = "md",
}: StatBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className={clsx("font-medium text-white/60", size === "sm" ? "text-xs" : "text-xs")}>
          {label}
        </span>
        {showValue && (
          <span className={clsx("font-mono font-semibold tabular-nums", size === "sm" ? "text-xs" : "text-xs", {
            "text-aura-purple": color === "purple",
            "text-aura-blue":   color === "blue",
            "text-aura-crimson":color === "crimson",
            "text-aura-gold":   color === "gold",
            "text-aura-green":  color === "green",
          })}>
            {value}
          </span>
        )}
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-700 ease-out",
            {
              "bg-aura-purple shadow-[0_0_8px_rgba(166,91,255,0.6)]":  color === "purple",
              "bg-aura-blue shadow-[0_0_8px_rgba(61,220,255,0.6)]":    color === "blue",
              "bg-aura-crimson shadow-[0_0_8px_rgba(255,46,85,0.6)]":  color === "crimson",
              "bg-aura-gold shadow-[0_0_8px_rgba(255,209,102,0.6)]":   color === "gold",
              "bg-aura-green shadow-[0_0_8px_rgba(6,255,165,0.6)]":    color === "green",
            }
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
