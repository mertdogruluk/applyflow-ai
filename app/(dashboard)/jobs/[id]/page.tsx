import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Pencil,
  ExternalLink,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  Globe,
  FileText,
} from "lucide-react";

import { requireUserId } from "@/lib/auth";
import { getJobByIdForUser } from "@/lib/queries/jobs";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/jobs/status-badge";
import { DeleteJobButton } from "@/components/jobs/delete-job-button";
import { LinkedProjects } from "@/components/jobs/linked-projects";
import { AiAnalysisPanel } from "@/components/jobs/ai-analysis-panel";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Job Details – ApplyFlow AI" };

const WORK_TYPE_LABEL = { REMOTE: "Remote", HYBRID: "Hybrid", ON_SITE: "On-site" } as const;
const JOB_TYPE_LABEL  = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
} as const;

type Params = { params: Promise<{ id: string }> };

export default async function JobDetailPage({ params }: Params) {
  const { id } = await params;
  const userId = await requireUserId();

  const job = await getJobByIdForUser(id, userId);
  if (!job) notFound();

  // Kullanıcının kendi projeleri (linkleme seçeneği için)
  const allProjects = await prisma.project.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, techStack: true },
  });

  const linkedProjectIds = job.projects.map((p) => p.projectId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <Link href="/jobs">
            <ChevronLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/jobs/${job.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
          <DeleteJobButton jobId={job.id} jobTitle={job.title} />
        </div>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-xl font-semibold tracking-tight">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {job.company}
              </span>
              {job.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                {WORK_TYPE_LABEL[job.workType]} · {JOB_TYPE_LABEL[job.jobType]}
              </span>
            </div>

            {job.jobUrl && (
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View original posting
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout on lg+ */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN — main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {job.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                  {job.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Linked Projects */}
          <LinkedProjects
            jobId={job.id}
            allProjects={allProjects}
            linkedProjectIds={linkedProjectIds}
            linked={job.projects.map((jp) => jp.project)}
          />

          {/* AI Analysis */}
          <AiAnalysisPanel jobId={job.id} analysis={job.analysis} />

          {/* Cover Letter */}
          {job.coverLetter && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                  {job.coverLetter}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {job.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {job.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN — meta */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <Detail icon={Calendar} label="Applied">
                  {formatDate(job.appliedAt) ?? "—"}
                </Detail>
                <Detail icon={Calendar} label="Deadline / Reminder">
                  {formatDate(job.deadline)}
                </Detail>
                <Detail icon={Globe} label="Source">
                  {job.source ?? "—"}
                </Detail>
                <Detail icon={DollarSign} label="Salary Range">
                  {job.salary ?? "—"}
                </Detail>
                <Detail icon={FileText} label="CV Version">
                  {job.cvVersion ?? "—"}
                </Detail>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Created</dt>
                  <dd className="text-foreground">{formatDate(job.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Last updated</dt>
                  <dd className="text-foreground">{formatDate(job.updatedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Detail row ──────────────────────────────────────────────────────────────

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}
