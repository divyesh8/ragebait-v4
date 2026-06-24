import { HTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "elevated" | "bordered" | "dark";
  hover?: boolean;
  glow?: "purple" | "blue" | "crimson" | "none";
  padding?: "none" | "sm" | "md" | "lg";
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = "default",
  hover = true,
  glow = "none",
  padding = "md",
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        "rounded-2xl transition-all duration-300",
        {
          "card-surface":
            variant === "default",
          "glass-surface":
            variant === "glass",
          "bg-surface2 border border-line shadow-card":
            variant === "elevated",
          "bg-transparent border border-line":
            variant === "bordered",
          "bg-void border border-line/60":
            variant === "dark",
        },
        hover && "hover:border-aura-purple/40 hover:shadow-card-hover",
        {
          "shadow-[0_0_30px_rgba(166,91,255,0.2)] border-aura-purple/30": glow === "purple",
          "shadow-[0_0_30px_rgba(61,220,255,0.2)] border-aura-blue/30":   glow === "blue",
          "shadow-[0_0_30px_rgba(255,46,85,0.2)] border-aura-crimson/30": glow === "crimson",
        },
        {
          "": padding === "none",
          "p-4": padding === "sm",
          "p-6": padding === "md",
          "p-8": padding === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
export default Card;
