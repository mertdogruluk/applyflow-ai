"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

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
  // Zod mesajları i18n anahtarıdır ("validation.x") — burada çevrilir.
  const t = useTranslations();
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message.startsWith("validation.") ? t(message) : message}
    </p>
  );
}

export function ProjectForm({
  defaultValues,
  action,
  submitLabel,
}: ProjectFormProps) {
  const t = useTranslations();
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
      const msg = err instanceof Error ? err.message : t("common.genericError");
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
          {t("projects.name")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder={t("projects.phName")}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">{t("projects.description")}</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder={t("projects.phDescription")}
          {...register("description")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="githubUrl">{t("projects.githubUrl")}</Label>
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
          <Label htmlFor="liveUrl">{t("projects.liveUrl")}</Label>
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
        <Label htmlFor="techStackInput">{t("projects.techStack")}</Label>
        <Input
          id="techStackInput"
          placeholder={t("projects.phTechStack")}
          {...register("techStackInput")}
        />
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("projects.techHint")}
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2 min-w-30">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? t("common.saving") : (submitLabel ?? t("projects.saveProject"))}
        </Button>
      </div>
    </form>
  );
}
