import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FileQuestion className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">Job not found</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        This job either doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Button asChild className="mt-6">
        <Link href="/jobs">Back to Jobs</Link>
      </Button>
    </div>
  );
}
