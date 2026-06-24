import clsx from "clsx";

interface AuraBadgeProps {
  value: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  trend?: "up" | "down" | "neutral";
  showLabel?: boolean;
  animated?: boolean;
}

export default function AuraBadge({
  value,
  size = "md",
  trend = "neutral",
  showLabel = true,
  animated = false,
}: AuraBadgeProps) {
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : null;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-mono font-semibold border transition-all duration-300",
        {
          "px-2 py-0.5 text-[10px]": size === "xs",
          "px-2.5 py-1 text-xs":     size === "sm",
          "px-3.5 py-1.5 text-sm":   size === "md",
          "px-5 py-2 text-base":     size === "lg",
          "px-6 py-2.5 text-xl":     size === "xl",
        },
        trend === "up"      && "border-aura-blue/30 bg-aura-blue/10 text-aura-blue",
        trend === "down"    && "border-aura-crimson/30 bg-aura-crimson/10 text-aura-crimson",
        trend === "neutral" && "border-aura-purple/30 bg-aura-purple/10 text-aura-purple",
        animated && "animate-pulseGlow"
      )}
    >
      {/* Dot */}
      <span
        className={clsx(
          "rounded-full flex-shrink-0",
          size === "xs" || size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
          trend === "up"      && "bg-aura-blue shadow-[0_0_6px_rgba(61,220,255,0.8)]",
          trend === "down"    && "bg-aura-crimson shadow-[0_0_6px_rgba(255,46,85,0.8)]",
          trend === "neutral" && "bg-aura-purple shadow-[0_0_6px_rgba(166,91,255,0.8)]"
        )}
      />

      {/* Value */}
      <span className="tabular-nums">
        {trend === "up" && "+"}
        {trend === "down" && value > 0 ? "" : ""}
        {value.toLocaleString()}
      </span>

      {/* Trend arrow */}
      {trendIcon && (
        <span className="text-[0.7em] opacity-80">{trendIcon}</span>
      )}

      {/* Label */}
      {showLabel && (
        <span className="opacity-60 font-body text-[0.85em] font-normal">AURA</span>
      )}
    </span>
  );
}
