import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[#1f2a37] text-white border border-transparent hover:bg-[#101926] active:translate-y-px",
  secondary:
    "bg-moss text-white border border-transparent hover:bg-[#17604f] active:translate-y-px",
  ghost:
    "bg-cloud text-ink border border-slate/30 hover:bg-mist active:translate-y-px",
  danger:
    "bg-rose-600 text-white border border-transparent hover:bg-rose-700 active:translate-y-px"
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
          variantClass[variant],
          sizeClass[size],
          className
        )}
        {...props}
      >
        {loading ? "Please wait..." : children}
      </button>
    );
  }
);

Button.displayName = "Button";
