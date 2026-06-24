import clsx from "clsx";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "purple" | "blue" | "white";
  className?: string;
}

export default function LoadingSpinner({ size = "md", color = "purple", className }: LoadingSpinnerProps) {
  return (
    <div
      className={clsx(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        {
          "h-4 w-4": size === "sm",
          "h-6 w-6": size === "md",
          "h-10 w-10 border-[3px]": size === "lg",
        },
        {
          "text-aura-purple": color === "purple",
          "text-aura-blue": color === "blue",
          "text-white": color === "white",
        },
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-white/40 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
