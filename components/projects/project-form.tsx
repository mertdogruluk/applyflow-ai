"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  projectFormSchema,
  type ProjectFormValues,
  type ProjectFormOutput,
} from "@/lib/validations/project";

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>;
  action: (data: unknown) => Promise<void>;
  submitLabel?: string;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

export function ProjectForm({
  defaultValues,
  action,
  submitLabel = "Save Project",
}: ProjectFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues, unknown, ProjectFormOutput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: ProjectFormOutput) => {
    setServerError(null);
    try {
      await action(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (!msg.includes("NEXT_REDIRECT")) setServerError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">
          Project Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="e.g. ApplyFlow AI"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Short summary of what this project does and the problem it solves…"
          {...register("description")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="githubUrl">GitHub URL</Label>
          <Input
            id="githubUrl"
            type="url"
            placeholder="https://github.com/..."
            aria-invalid={!!errors.githubUrl}
            {...register("githubUrl")}
          />
          <FieldError message={errors.githubUrl?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="liveUrl">Live URL</Label>
          <Input
            id="liveUrl"
            type="url"
            placeholder="https://..."
            aria-invalid={!!errors.liveUrl}
            {...register("liveUrl")}
          />
          <FieldError message={errors.liveUrl?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="techStackInput">Tech Stack</Label>
        <Input
          id="techStackInput"
          placeholder="Next.js, TypeScript, PostgreSQL"
          {...register("techStackInput")}
        />
        <p className="mt-0.5 text-xs text-muted-foreground">
          Comma-separated. These badges show up on your project card.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2 min-w-[120px]">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
