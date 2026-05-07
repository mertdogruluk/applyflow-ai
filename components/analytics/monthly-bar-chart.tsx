import type { MonthlyPoint } from "@/lib/queries/analytics";

interface Props {
  data: MonthlyPoint[];
}

/**
 * Pure-CSS bar chart — extra kütüphaneye gerek yok.
 * Veri yoksa empty state göster.
 */
export function MonthlyBarChart({ data }: Props) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No applications in the last {data.length} months yet.
      </p>
    );
  }

  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((d) => {
        const heightPct = (d.count / max) * 100;
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-primary/80 transition-all"
                style={{ height: `${heightPct}%` }}
                title={`${d.label}: ${d.count}`}
              />
              {d.count > 0 && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium tabular-nums">
                  {d.count}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
