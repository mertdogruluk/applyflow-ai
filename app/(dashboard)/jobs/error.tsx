"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function JobsError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations();

  return (
    <div className="flex min-h-100 flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">
        {t("jobs.errorTitle")}
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        {t("jobs.errorDesc")}
      </p>
      <Button onClick={reset} variant="outline" size="sm" className="mt-5 gap-1.5">
        <RotateCcw className="h-3.5 w-3.5" />
        {t("common.tryAgain")}
      </Button>
    </div>
  );
}
