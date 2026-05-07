import type { ApplicationStatus } from "@prisma/client";
import { STATUS_CONFIG, STATUS_OPTIONS } from "@/lib/status";

interface Props {
  byStatus: Record<ApplicationStatus, number>;
  total: number;
}

export function StatusDistribution({ byStatus, total }: Props) {
  const max = Math.max(1, ...Object.values(byStatus));

  return (
    <ul className="space-y-2">
      {STATUS_OPTIONS.map(({ value, label }) => {
        const count = byStatus[value];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const widthPct = (count / max) * 100;
        return (
          <li key={value} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm">
            <span className="text-xs text-muted-foreground">{label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${STATUS_CONFIG[value].badge}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
              {count} <span className="opacity-60">({pct}%)</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
