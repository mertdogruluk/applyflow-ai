import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjectsEmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FolderKanban className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-foreground">
        No projects yet
      </h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Add your portfolio projects so the AI can match them against job
        descriptions and tailor your CV bullets.
      </p>
      <Button asChild className="mt-6 gap-2">
        <Link href="/projects/new">
          <Plus className="h-4 w-4" />
          Add your first project
        </Link>
      </Button>
    </div>
  );
}
