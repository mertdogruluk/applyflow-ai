import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireUserId } from "@/lib/auth";
import { getProjectByIdForUser } from "@/lib/queries/projects";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/projects/project-form";
import { updateProject } from "@/app/(dashboard)/projects/actions";
import type { ProjectFormValues } from "@/lib/validations/project";

export const metadata = { title: "Edit Project – ApplyFlow AI" };

type Params = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Params) {
  const { id } = await params;
  const userId = await requireUserId();

  const project = await getProjectByIdForUser(id, userId);
  if (!project) notFound();

  const defaults: Partial<ProjectFormValues> = {
    name:           project.name,
    description:    project.description ?? "",
    githubUrl:      project.githubUrl ?? "",
    liveUrl:        project.liveUrl ?? "",
    techStackInput: project.techStack.join(", "),
  };

  const action = updateProject.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
        <Link href={`/projects/${id}`}>
          <ChevronLeft className="h-4 w-4" />
          Back to Project
        </Link>
      </Button>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">Edit Project</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the details of <span className="font-medium text-foreground">{project.name}</span>.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <ProjectForm action={action} defaultValues={defaults} submitLabel="Save Changes" />
      </div>
    </div>
  );
}
