"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteJob } from "@/app/(dashboard)/jobs/actions";

interface DeleteJobButtonProps {
  jobId: string;
  jobTitle: string;
}

export function DeleteJobButton({ jobId, jobTitle }: DeleteJobButtonProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {t("common.delete")}
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={async () => {
          try {
            await deleteJob(jobId);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "";
            // redirect throws NEXT_REDIRECT — that's success
            if (!msg.includes("NEXT_REDIRECT")) throw err;
          }
        }}
        title={t("jobs.deleteConfirmTitle")}
        description={t("jobs.deleteConfirmDesc", { title: jobTitle })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        destructive
      />
    </>
  );
}
