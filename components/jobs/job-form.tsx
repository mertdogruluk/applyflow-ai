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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  jobFormSchema,
  type JobFormValues,
  type JobFormOutput,
  APPLICATION_STATUS_VALUES,
  WORK_TYPE_VALUES,
  JOB_TYPE_VALUES,
} from "@/lib/validations/job";
import { JobAiAnalyzer } from "@/components/jobs/job-ai-analyzer";
import { JobRequirementsPreview } from "@/components/jobs/job-requirements-preview";
import type { JobAnalysis } from "@/lib/ai/job-parser";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobFormProps {
  /** Dolu geçilirse edit modu; boş geçilirse create modu */
  defaultValues?: Partial<JobFormValues>;
  /** Server Action (createJob veya ileride updateJob) */
  action: (data: unknown) => Promise<void>;
  /** Submit buton etiketi */
  submitLabel?: string;
}

// ─── Field helpers ────────────────────────────────────────────────────────────

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

function FormField({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ?? "flex flex-col gap-1.5"}>{children}</div>;
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 border-b border-border pb-4">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function JobForm({ defaultValues, action, submitLabel }: JobFormProps) {
  const t = useTranslations();
  const [serverError, setServerError] = useState<string | null>(null);
  // Son analizin kaynak metni — description sonradan elle değişirse
  // rozet panelinde "bayat" uyarısı göstermek için.
  const [analyzedSource, setAnalyzedSource] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues, unknown, JobFormOutput>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      status:   "WISHLIST",
      workType: "HYBRID",
      jobType:  "FULL_TIME",
      ...defaultValues,
    },
  });

  // AI analizi → form alanları. description açık alan olarak dolar;
  // mustHaves/niceToHaves/minYearsExperience input'suz (gizli) RHF alanlarıdır.
  const applyAnalysis = (analysis: JobAnalysis, sourceText: string) => {
    setValue("description", sourceText, { shouldDirty: true });
    setValue("mustHaves", analysis.must_haves, { shouldDirty: true });
    setValue("niceToHaves", analysis.nice_to_haves, { shouldDirty: true });
    setValue("minYearsExperience", analysis.min_years_experience, { shouldDirty: true });
    setAnalyzedSource(sourceText);
  };

  const watchedMustHaves   = watch("mustHaves") ?? [];
  const watchedNiceToHaves = watch("niceToHaves") ?? [];
  const watchedMinYears    = watch("minYearsExperience");
  const watchedDescription = watch("description");
  const analysisIsStale =
    analyzedSource !== null && (watchedDescription ?? "").trim() !== analyzedSource;

  const onSubmit = async (data: JobFormOutput) => {
    setServerError(null);
    // Bu oturumda AI analizi yapılmadıysa parsed alanları GÖNDERME:
    // göndermek server'a "taze analiz" sinyali verir (parsedAt yenilenir,
    // arka plan yeniden-parse atlanır). Düşürünce server mevcut değerleri
    // korur ve description değiştiyse kendisi yeniden parse eder.
    const payload =
      analyzedSource === null
        ? { ...data, mustHaves: undefined, niceToHaves: undefined, minYearsExperience: undefined }
        : data;
    try {
      await action(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.genericError");
      // Server redirect hataları "NEXT_REDIRECT" içerir — onları gösterme
      if (!msg.includes("NEXT_REDIRECT")) {
        setServerError(msg);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {/* Global server error */}
      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* ── Section 0: AI Smart Fill ─────────────────────────────────────── */}
      <JobAiAnalyzer onAnalyzed={applyAnalysis} />

      {/* ── Section 1: Core Info ──────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title={t("jobForm.sectionCore")}
          description={t("jobForm.sectionCoreDesc")}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="title">
              {t("jobForm.jobTitle")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder={t("jobForm.phTitle")}
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            <FieldError message={errors.title?.message} />
          </FormField>

          <FormField>
            <Label htmlFor="company">
              {t("jobForm.company")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company"
              placeholder={t("jobForm.phCompany")}
              aria-invalid={!!errors.company}
              {...register("company")}
            />
            <FieldError message={errors.company?.message} />
          </FormField>

          <FormField>
            <Label htmlFor="status">
              {t("jobForm.status")} <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={defaultValues?.status ?? "WISHLIST"}
              onValueChange={(v) => setValue("status", v as JobFormValues["status"], { shouldValidate: true })}
            >
              <SelectTrigger id="status" aria-invalid={!!errors.status}>
                <SelectValue placeholder={t("jobForm.selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STATUS_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`status.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.status?.message} />
          </FormField>
        </div>
      </section>

      {/* ── Section 2: Position Details ──────────────────────────────────── */}
      <section>
        <SectionHeader
          title={t("jobForm.sectionPosition")}
          description={t("jobForm.sectionPositionDesc")}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField>
            <Label htmlFor="location">{t("jobForm.location")}</Label>
            <Input
              id="location"
              placeholder={t("jobForm.phLocation")}
              {...register("location")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="salaryRange">{t("jobForm.salaryRange")}</Label>
            <Input
              id="salaryRange"
              placeholder={t("jobForm.phSalary")}
              {...register("salaryRange")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="workType">{t("jobForm.workType")}</Label>
            <Select
              defaultValue={defaultValues?.workType ?? "HYBRID"}
              onValueChange={(v) => setValue("workType", v as JobFormValues["workType"])}
            >
              <SelectTrigger id="workType">
                <SelectValue placeholder={t("jobForm.selectWorkType")} />
              </SelectTrigger>
              <SelectContent>
                {WORK_TYPE_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`workType.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField>
            <Label htmlFor="jobType">{t("jobForm.jobType")}</Label>
            <Select
              defaultValue={defaultValues?.jobType ?? "FULL_TIME"}
              onValueChange={(v) => setValue("jobType", v as JobFormValues["jobType"])}
            >
              <SelectTrigger id="jobType">
                <SelectValue placeholder={t("jobForm.selectJobType")} />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPE_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`jobType.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </section>

      {/* ── Section 3: Application Info ──────────────────────────────────── */}
      <section>
        <SectionHeader
          title={t("jobForm.sectionApplication")}
          description={t("jobForm.sectionApplicationDesc")}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="url">{t("jobForm.jobUrl")}</Label>
            <Input
              id="url"
              type="url"
              placeholder={t("jobForm.phUrl")}
              aria-invalid={!!errors.url}
              {...register("url")}
            />
            <FieldError message={errors.url?.message} />
          </FormField>

          <FormField>
            <Label htmlFor="source">{t("jobForm.source")}</Label>
            <Input
              id="source"
              placeholder={t("jobForm.phSource")}
              {...register("source")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="cvVersion">{t("jobForm.cvVersion")}</Label>
            <Input
              id="cvVersion"
              placeholder={t("jobForm.phCvVersion")}
              {...register("cvVersion")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="appliedAt">{t("jobForm.appliedDate")}</Label>
            <Input
              id="appliedAt"
              type="date"
              {...register("appliedAt")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="reminderDate">{t("jobForm.reminderDeadline")}</Label>
            <Input
              id="reminderDate"
              type="date"
              {...register("reminderDate")}
            />
          </FormField>
        </div>
      </section>

      {/* ── Section 4: Notes & Documents ─────────────────────────────────── */}
      <section>
        <SectionHeader
          title={t("jobForm.sectionNotes")}
          description={t("jobForm.sectionNotesDesc")}
        />
        <div className="grid gap-6">
          <FormField>
            <Label htmlFor="description">{t("jobForm.description")}</Label>
            <Textarea
              id="description"
              placeholder={t("jobForm.phDescription")}
              rows={5}
              {...register("description")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="coverLetter">{t("jobForm.coverLetter")}</Label>
            <Textarea
              id="coverLetter"
              placeholder={t("jobForm.phCoverLetter")}
              rows={5}
              {...register("coverLetter")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="notes">{t("jobForm.personalNotes")}</Label>
            <Textarea
              id="notes"
              placeholder={t("jobForm.phNotes")}
              rows={3}
              {...register("notes")}
            />
          </FormField>
        </div>
      </section>

      {/* ── Section 5: AI-extracted requirements ─────────────────────────── */}
      <JobRequirementsPreview
        mustHaves={watchedMustHaves}
        niceToHaves={watchedNiceToHaves}
        minYearsExperience={watchedMinYears}
        stale={analysisIsStale}
      />

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 border-t border-border pt-8">
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
          {isSubmitting ? t("common.saving") : (submitLabel ?? t("jobForm.saveJob"))}
        </Button>
      </div>
    </form>
  );
}
