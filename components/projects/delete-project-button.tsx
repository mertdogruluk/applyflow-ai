"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteProject } from "@/app/(dashboard)/projects/actions";

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
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
        Delete
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
        title="Delete this project?"
        description={`"${projectName}" will be removed from all linked job applications.`}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
