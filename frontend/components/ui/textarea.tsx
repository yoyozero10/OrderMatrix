import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-slate/30 bg-cloud px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate",
          "focus:border-moss focus:ring-2 focus:ring-moss/25",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
