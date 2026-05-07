import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FileQuestion className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">Project not found</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        This project either doesn&apos;t exist or you don&apos;t have access.
      </p>
      <Button asChild className="mt-6">
        <Link href="/projects">Back to Projects</Link>
      </Button>
    </div>
  );
}
