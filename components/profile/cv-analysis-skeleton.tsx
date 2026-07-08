import { Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

/**
 * Analiz sırasında gösterilen iskelet — ProfileSummaryCard'ın birebir
 * yerleşimini taklit eder ki sonuç geldiğinde layout zıplaması olmasın.
 */
export function CvAnalysisSkeleton() {
  return (
    <Card aria-busy="true" aria-live="polite">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 animate-pulse text-primary" />
          <span className="animate-pulse text-muted-foreground">
            AI is analyzing your CV…
          </span>
        </div>
        <Skeleton className="h-3.5 w-48" />
      </CardHeader>

      <CardContent className="space-y-5">
        <Skeleton className="h-4 w-40" />

        <Separator />

        <div className="space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-28 rounded-4xl" />
            <Skeleton className="h-5 w-20 rounded-4xl" />
            <Skeleton className="h-5 w-32 rounded-4xl" />
          </div>
        </div>

        <div className="space-y-2.5">
          <Skeleton className="h-3 w-32" />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-16 rounded-4xl" />
            <Skeleton className="h-5 w-24 rounded-4xl" />
            <Skeleton className="h-5 w-14 rounded-4xl" />
            <Skeleton className="h-5 w-20 rounded-4xl" />
            <Skeleton className="h-5 w-24 rounded-4xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
