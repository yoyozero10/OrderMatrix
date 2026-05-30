import { STATUS_COLORS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type StatusPillProps = {
  status: OrderStatus;
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        STATUS_COLORS[status]
      )}
    >
      {status}
    </span>
  );
}
