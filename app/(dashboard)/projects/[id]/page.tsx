import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Pencil,
  Github,
  ExternalLink,
  Briefcase,
} from "lucide-react";

import { requireUserId } from "@/lib/auth";
import { getProjectByIdForUser } from "@/lib/queries/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/jobs/status-badge";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Project – ApplyFlow AI" };

type Params = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: Params) {
  const { id } = await params;
  const userId = await requireUserId();

  const project = await getProjectByIdForUser(id, userId);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
          <Link href="/projects">
            <ChevronLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/projects/${project.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-sm leading-6 text-foreground/90 whitespace-pre-wrap">
              {project.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Live demo
              </a>
            )}
            <span className="text-xs text-muted-foreground">
              · Updated {formatDate(project.updatedAt)}
            </span>
          </div>

          {project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {project.techStack.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            Linked Jobs ({project.jobs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No jobs link this project yet. Open a job and link it from the
              &ldquo;Linked Projects&rdquo; section.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {project.jobs.map(({ job }) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 hover:bg-muted/40 -mx-2 px-2 rounded-md"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{job.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{job.company}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
