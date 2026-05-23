import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border-slate/25 bg-slate-100 text-slate-700",
  success: "border-emerald-200 bg-emerald-100 text-emerald-800",
  warning: "border-amber-200 bg-amber-100 text-amber-800",
  danger: "border-rose-200 bg-rose-100 text-rose-800",
  info: "border-sky-200 bg-sky-100 text-sky-800"
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
