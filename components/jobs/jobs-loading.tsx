import { Card } from "@/components/ui/card";

// Single skeleton row
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      {/* Icon */}
      <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted" />
      {/* Text lines */}
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
      </div>
      {/* Date */}
      <div className="hidden h-3 w-20 animate-pulse rounded bg-muted sm:block" />
      {/* Badge */}
      <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
    </div>
  );
}

export function JobsLoading() {
  return (
    <Card className="overflow-hidden p-0">
      {/* Header skeleton */}
      <div className="border-b border-border bg-muted/30 px-5 py-2.5">
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
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
