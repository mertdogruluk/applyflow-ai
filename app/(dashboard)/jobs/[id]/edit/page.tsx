import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { requireUserId } from "@/lib/auth";
import { getJobByIdForUser } from "@/lib/queries/jobs";
import { toDateInputValue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { JobForm } from "@/components/jobs/job-form";
import { updateJob } from "@/app/(dashboard)/jobs/actions";
import type { JobFormValues } from "@/lib/validations/job";

export const metadata = { title: "Edit Job – ApplyFlow AI" };

type Params = { params: Promise<{ id: string }> };

export default async function EditJobPage({ params }: Params) {
  const { id } = await params;
  const userId = await requireUserId();

  const job = await getJobByIdForUser(id, userId);
  if (!job) notFound();

  // DB → form input shape
  const defaults: Partial<JobFormValues> = {
    title:        job.title,
    company:      job.company,
    status:       job.status,
    location:     job.location ?? "",
    workType:     job.workType,
    jobType:      job.jobType,
    url:          job.jobUrl ?? "",
    salaryRange:  job.salary ?? "",
    source:       job.source ?? "",
    description:  job.description ?? "",
    notes:        job.notes ?? "",
    cvVersion:    job.cvVersion ?? "",
    coverLetter:  job.coverLetter ?? "",
    appliedAt:    toDateInputValue(job.appliedAt),
    reminderDate: toDateInputValue(job.deadline),
    // Kayıtlı AI gereksinimleri — rozetler edit'te dolu gelsin.
    // Yeniden analiz yapılmadıkça submit'te forma GERİ GÖNDERİLMEZ
    // (JobForm onSubmit'teki analyzedSource guard'ı düşürür).
    mustHaves:          job.mustHaves,
    niceToHaves:        job.niceToHaves,
    minYearsExperience: job.minYearsExperience,
  };

  // Server Action partially applied with the job id
  const action = updateJob.bind(null, id);
  const t = await getTranslations("jobs");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
        <Link href={`/jobs/${id}`}>
          <ChevronLeft className="h-4 w-4" />
          {t("backToJob")}
        </Link>
      </Button>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("editTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("editSubtitle", { title: job.title })}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <JobForm action={action} defaultValues={defaults} submitLabel={t("saveChanges")} />
      </div>
    </div>
  );
}
