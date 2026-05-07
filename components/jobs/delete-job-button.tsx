"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteJob } from "@/app/(dashboard)/jobs/actions";

interface DeleteJobButtonProps {
  jobId: string;
  jobTitle: string;
}

export function DeleteJobButton({ jobId, jobTitle }: DeleteJobButtonProps) {
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
            await deleteJob(jobId);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "";
            // redirect throws NEXT_REDIRECT — that's success
            if (!msg.includes("NEXT_REDIRECT")) throw err;
          }
        }}
        title="Delete this job?"
        description={`"${jobTitle}" and all its linked data (analysis, project links, reminders) will be permanently removed.`}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
