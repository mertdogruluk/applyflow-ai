import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { requireUserId } from "@/lib/auth";
import { getJobsByUser } from "@/lib/queries/jobs";
import { Button } from "@/components/ui/button";
import { JobList } from "@/components/jobs/job-list";
import { JobsEmptyState } from "@/components/jobs/jobs-empty-state";
import { JobsLoading } from "@/components/jobs/jobs-loading";

export const metadata = { title: "Jobs – ApplyFlow AI" };

// ─── Jobs content (async; errors bubble to error.tsx) ────────────────────────

async function JobsContent({ userId }: { userId: string }) {
  const jobs = await getJobsByUser(userId);

  if (jobs.length === 0) {
    return <JobsEmptyState />;
  }

  return <JobList jobs={jobs} />;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function JobsPage() {
  const userId = await requireUserId();
  const t = await getTranslations("jobs");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Button asChild size="sm" className="shrink-0 gap-2">
          <Link href="/jobs/new">
            <Plus className="h-4 w-4" />
            {t("newJob")}
          </Link>
        </Button>
      </div>

      <Suspense fallback={<JobsLoading />}>
        <JobsContent userId={userId} />
      </Suspense>
    </div>
  );
}
