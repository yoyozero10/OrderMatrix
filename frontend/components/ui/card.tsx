import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl2 border border-slate/20 bg-cloud p-5 shadow-card",
        className
      )}
      {...props}
    />
  );
}
