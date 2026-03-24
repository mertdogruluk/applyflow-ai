import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  delta?: number; // positive = up, negative = down, 0/undefined = neutral
  icon: LucideIcon;
}

export function StatCard({
  title,
  value,
  description,
  delta,
  icon: Icon,
}: StatCardProps) {
  const DeltaIcon =
    delta === undefined || delta === 0
      ? Minus
      : delta > 0
        ? TrendingUp
        : TrendingDown;

  const deltaColor =
    delta === undefined || delta === 0
      ? "text-muted-foreground"
      : delta > 0
        ? "text-emerald-500"
        : "text-rose-500";

  const deltaLabel =
    delta === undefined || delta === 0
      ? "No change"
      : `${delta > 0 ? "+" : ""}${delta}% from last month`;

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-foreground/70" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {(description || delta !== undefined) && (
          <p className={cn("mt-1 flex items-center gap-1 text-xs", deltaColor)}>
            <DeltaIcon className="h-3 w-3" />
            {description ?? deltaLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
