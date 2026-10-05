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
    "bg-[#0071e3] text-white border border-transparent hover:bg-[#0077ed] active:scale-[0.98]",
  secondary:
    "bg-white text-[#1d1d1f] border border-black/[0.08] hover:bg-black/[0.03] active:scale-[0.98] shadow-sm",
  ghost:
    "bg-transparent text-[#1d1d1f] border border-transparent hover:bg-black/[0.04] active:scale-[0.98]",
  danger:
    "bg-[#ff3b30] text-white border border-transparent hover:bg-[#e0342a] active:scale-[0.98]"
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3.5 text-xs rounded-full",
  md: "h-10 px-4 text-sm rounded-full",
  lg: "h-11 px-5 text-sm font-medium rounded-full"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition duration-150 disabled:cursor-not-allowed disabled:opacity-50",
          variantClass[variant],
          sizeClass[size],
          className
        )}
        {...props}
      >
        {loading ? "Đang xử lý..." : children}
      </button>
    );
  }
);

Button.displayName = "Button";
