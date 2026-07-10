import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ProjectsEmptyState() {
  const t = useTranslations("projects");

  return (
    <div className="flex min-h-100 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FolderKanban className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-foreground">
        {t("emptyTitle")}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        {t("emptyDesc")}
      </p>
      <Button asChild className="mt-6 gap-2">
        <Link href="/projects/new">
          <Plus className="h-4 w-4" />
          {t("emptyCta")}
        </Link>
      </Button>
    </div>
  );
}
