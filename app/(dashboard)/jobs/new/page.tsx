import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { JobForm } from "@/components/jobs/job-form";
import { createJob } from "@/app/(dashboard)/jobs/actions";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New Job – ApplyFlow AI" };

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <Link href="/jobs">
            <ChevronLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Add New Job</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details below to track a new job application.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <JobForm action={createJob} submitLabel="Add Job" />
      </div>
    </div>
  );
}
