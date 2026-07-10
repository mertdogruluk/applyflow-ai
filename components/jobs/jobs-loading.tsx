import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Single skeleton row
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-5">
      {/* Icon */}
      <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
      {/* Text lines */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      {/* Date */}
      <Skeleton className="hidden h-3 w-20 sm:block" />
      {/* Badge */}
      <Skeleton className="h-5 w-16 rounded-4xl" />
    </div>
  );
}

export function JobsLoading() {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      {/* Header skeleton */}
      <div className="border-b border-border bg-muted/30 px-6 py-3">
        <Skeleton className="h-3 w-32" />
      </div>
      {/* Row skeletons */}
      <ul className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>
            <SkeletonRow />
          </li>
        ))}
      </ul>
    </Card>
  );
}
