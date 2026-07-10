import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/projects/project-form";
import { createProject } from "@/app/(dashboard)/projects/actions";

export const metadata = { title: "New Project – ApplyFlow AI" };

export default async function NewProjectPage() {
  const t = await getTranslations("projects");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
        <Link href="/projects">
          <ChevronLeft className="h-4 w-4" />
          {t("backToProjects")}
        </Link>
      </Button>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("newTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("newSubtitle")}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <ProjectForm action={createProject} submitLabel={t("addProject")} />
      </div>
    </div>
  );
}
