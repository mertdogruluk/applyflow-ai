import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function ProjectNotFound() {
  const t = await getTranslations("projects");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FileQuestion className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">{t("notFoundTitle")}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {t("notFoundDesc")}
      </p>
      <Button asChild className="mt-6">
        <Link href="/projects">{t("backToProjects")}</Link>
      </Button>
    </div>
  );
}
