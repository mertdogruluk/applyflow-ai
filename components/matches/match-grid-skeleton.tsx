import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function MatchCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="size-20 shrink-0 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        <Skeleton className="h-16 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

/**
 * Eşleştirme sürerken gösterilen grid iskeleti — sonuç grid'inin birebir
 * yerleşimi (layout zıplaması yok) + hakem mikrodurumu.
 */
export function MatchGridSkeleton({
  count = 6,
  message,
}: {
  count?: number;
  message?: string;
}) {
  const t = useTranslations("matches");

  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="size-4 animate-pulse text-primary" />
        <span className="animate-pulse">{message ?? t("skeletonDefault")}</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
