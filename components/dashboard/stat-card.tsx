import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("statCard");
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
        ? "text-success"
        : "text-destructive";

  const deltaLabel =
    delta === undefined || delta === 0
      ? t("noChange")
      : t("fromLastMonth", { delta: `${delta > 0 ? "+" : ""}${delta}` });

  return (
    <Card className="relative overflow-hidden py-6 transition-all duration-300 ease-out hover:shadow-elevated">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="px-6">
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        {(description || delta !== undefined) && (
          <p className={cn("mt-1.5 flex items-center gap-1 text-xs", deltaColor)}>
            <DeltaIcon className="h-3 w-3" />
            {description ?? deltaLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
