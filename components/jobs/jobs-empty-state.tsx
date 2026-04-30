import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JobsEmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Briefcase className="h-7 w-7 text-muted-foreground" />
      </div>

      {/* Text */}
      <h3 className="mt-5 text-base font-semibold text-foreground">
        No applications yet
      </h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Start tracking your job search. Add your first application and stay on top of every opportunity.
      </p>

      {/* CTA */}
      <Button asChild className="mt-6 gap-2">
        <Link href="/jobs/new">
          <Plus className="h-4 w-4" />
          Add your first job
        </Link>
      </Button>
    </div>
  );
}
