import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  rightSlot?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  rightSlot
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-slate/20 pb-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.22em] text-moss">{eyebrow}</p> : null}
        <h2 className="font-heading text-2xl font-bold text-ink">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate">{description}</p> : null}
      </div>
      {rightSlot}
    </div>
  );
}
