import { Card } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
};

export function MetricCard({ label, value, hint, emphasize = false }: MetricCardProps) {
  return (
    <Card className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-[0.17em] text-slate">{label}</p>
      <p
        className={`font-heading font-black text-ink ${
          emphasize
            ? "text-[clamp(2.2rem,3vw,3.2rem)] leading-[1.05] break-words"
            : "text-3xl"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="text-sm text-slate">{hint}</p> : null}
    </Card>
  );
}
