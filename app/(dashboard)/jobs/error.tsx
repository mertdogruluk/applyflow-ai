"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">
        Failed to load jobs
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        There was a problem loading your jobs. Try again or refresh the page.
      </p>
      <Button onClick={reset} variant="outline" size="sm" className="mt-5 gap-1.5">
        <RotateCcw className="h-3.5 w-3.5" />
        Try again
      </Button>
    </div>
  );
}
