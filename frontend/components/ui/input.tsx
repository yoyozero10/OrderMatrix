import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-slate/30 bg-cloud px-3 text-sm text-ink outline-none transition placeholder:text-slate",
        "focus:border-moss focus:ring-2 focus:ring-moss/25",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
