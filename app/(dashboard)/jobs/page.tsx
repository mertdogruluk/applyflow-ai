import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Plus, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { JobList } from "@/components/jobs/job-list";
import { JobsEmptyState } from "@/components/jobs/jobs-empty-state";
import { JobsLoading } from "@/components/jobs/jobs-loading";

export const metadata = { title: "Jobs – ApplyFlow AI" };

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getJobs(userId: string) {
  return prisma.job.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Jobs content (async, throws on DB error) ─────────────────────────────────

async function JobsContent({ userId }: { userId: string }) {
  const jobs = await getJobs(userId);

  if (jobs.length === 0) {
    return <JobsEmptyState />;
  }

  return <JobList jobs={jobs} />;
}

// ─── Error UI ────────────────────────────────────────────────────────────────

function JobsError() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">
        Failed to load jobs
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        There was a problem connecting to the database. Please refresh the page or try again later.
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function JobsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Jobs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage all your job applications in one place.
          </p>
        </div>

        <Button asChild size="sm" className="shrink-0 gap-2">
          <Link href="/jobs/new">
            <Plus className="h-4 w-4" />
            New Job
          </Link>
        </Button>
      </div>

      {/* Jobs list — Suspense shows skeleton while data loads */}
      <Suspense fallback={<JobsLoading />}>
        <JobsContentWrapper userId={userId} />
      </Suspense>
    </div>
  );
}

// Wrapper to catch DB errors without a full error boundary
async function JobsContentWrapper({ userId }: { userId: string }) {
  try {
    return <JobsContent userId={userId} />;
  } catch {
    return <JobsError />;
  }
}
