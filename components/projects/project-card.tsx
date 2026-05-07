import Link from "next/link";
import { Github, ExternalLink, Briefcase } from "lucide-react";
import type { Project } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: Project & { _count: { jobs: number } };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="group relative flex flex-col gap-3 p-5 transition-shadow hover:shadow-md">
      <Link href={`/projects/${project.id}`} className="absolute inset-0 z-0" aria-label={project.name} />

      <CardContent className="flex flex-col gap-3 p-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground group-hover:underline">
            {project.name}
          </h3>
          {project._count.jobs > 0 && (
            <span className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              <Briefcase className="h-2.5 w-2.5" />
              {project._count.jobs}
            </span>
          )}
        </div>

        {project.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {project.description}
          </p>
        )}

        {project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.techStack.slice(0, 6).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        )}

        <div className="relative z-10 mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <Github className="h-3 w-3" />
              GitHub
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Live
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
