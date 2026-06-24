import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "gold";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-aura-blue focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:cursor-not-allowed disabled:opacity-50 select-none",
        {
          // primary — purple→blue gradient
          "rounded-full bg-aura-gradient text-void shadow-glow hover:opacity-90 hover:shadow-[0_0_50px_rgba(166,91,255,0.5)] active:scale-[0.98]":
            variant === "primary",
          // secondary — outlined glass
          "rounded-full border border-line bg-surface2/80 text-white hover:border-aura-purple/60 hover:bg-surface3 hover:shadow-glow-sm active:scale-[0.98]":
            variant === "secondary",
          // ghost — text only
          "rounded-xl text-white/60 hover:text-white hover:bg-white/5 active:scale-[0.98]":
            variant === "ghost",
          // danger — crimson
          "rounded-full bg-aura-crimson text-white shadow-glow-crimson hover:opacity-90 hover:shadow-[0_0_50px_rgba(255,46,85,0.5)] active:scale-[0.98]":
            variant === "danger",
          // success — green
          "rounded-full bg-aura-green text-void hover:opacity-90 active:scale-[0.98]":
            variant === "success",
          // gold — premium
          "rounded-full bg-gold-gradient text-void shadow-glow-gold hover:opacity-90 active:scale-[0.98]":
            variant === "gold",
        },
        {
          "px-3 py-1.5 text-xs": size === "xs",
          "px-4 py-2 text-sm":   size === "sm",
          "px-6 py-3 text-sm":   size === "md",
          "px-8 py-4 text-base": size === "lg",
          "px-10 py-5 text-lg":  size === "xl",
        },
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = "Button";
export default Button;
