"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteProject } from "@/app/(dashboard)/projects/actions";

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
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
            await deleteProject(projectId);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "";
            if (!msg.includes("NEXT_REDIRECT")) throw err;
          }
        }}
        title={t("projects.deleteConfirmTitle")}
        description={t("projects.deleteConfirmDesc", { name: projectName })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        destructive
      />
    </>
  );
}
