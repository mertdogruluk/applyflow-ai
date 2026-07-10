import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { requireUserId } from "@/lib/auth";
import { getProjectsByUser } from "@/lib/queries/projects";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectsEmptyState } from "@/components/projects/projects-empty-state";

export const metadata = { title: "Projects – ApplyFlow AI" };

export default async function ProjectsPage() {
  const userId = await requireUserId();
  const projects = await getProjectsByUser(userId);
  const t = await getTranslations("projects");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild size="sm" className="shrink-0 gap-2">
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            {t("newProject")}
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <ProjectsEmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
