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
  APPLICATION_STATUS_OPTIONS,
  WORK_TYPE_OPTIONS,
  JOB_TYPE_OPTIONS,
} from "@/lib/validations/job";

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
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

function FormField({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ?? "flex flex-col gap-1.5"}>{children}</div>;
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4 border-b border-border pb-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function JobForm({ defaultValues, action, submitLabel = "Save Job" }: JobFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

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

  const onSubmit = async (data: JobFormOutput) => {
    setServerError(null);
    try {
      await action(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
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

      {/* ── Section 1: Core Info ──────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Core Information"
          description="Required fields to identify the position."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="title">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Frontend Developer"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            <FieldError message={errors.title?.message} />
          </FormField>

          <FormField>
            <Label htmlFor="company">
              Company <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company"
              placeholder="e.g. Acme Corp"
              aria-invalid={!!errors.company}
              {...register("company")}
            />
            <FieldError message={errors.company?.message} />
          </FormField>

          <FormField>
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={defaultValues?.status ?? "WISHLIST"}
              onValueChange={(v) => setValue("status", v as JobFormValues["status"], { shouldValidate: true })}
            >
              <SelectTrigger id="status" aria-invalid={!!errors.status}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
          title="Position Details"
          description="Location, work arrangement, and salary information."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Istanbul, TR"
              {...register("location")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="salaryRange">Salary Range</Label>
            <Input
              id="salaryRange"
              placeholder="e.g. ₺50,000 – ₺70,000"
              {...register("salaryRange")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="workType">Work Type</Label>
            <Select
              defaultValue={defaultValues?.workType ?? "HYBRID"}
              onValueChange={(v) => setValue("workType", v as JobFormValues["workType"])}
            >
              <SelectTrigger id="workType">
                <SelectValue placeholder="Select work type" />
              </SelectTrigger>
              <SelectContent>
                {WORK_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField>
            <Label htmlFor="jobType">Job Type</Label>
            <Select
              defaultValue={defaultValues?.jobType ?? "FULL_TIME"}
              onValueChange={(v) => setValue("jobType", v as JobFormValues["jobType"])}
            >
              <SelectTrigger id="jobType">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
          title="Application Info"
          description="Where you found the job and your application details."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="url">Job URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://..."
              aria-invalid={!!errors.url}
              {...register("url")}
            />
            <FieldError message={errors.url?.message} />
          </FormField>

          <FormField>
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              placeholder="e.g. LinkedIn, Indeed, Referral"
              {...register("source")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="cvVersion">CV Version</Label>
            <Input
              id="cvVersion"
              placeholder="e.g. v3-senior-frontend"
              {...register("cvVersion")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="appliedAt">Applied Date</Label>
            <Input
              id="appliedAt"
              type="date"
              {...register("appliedAt")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="reminderDate">Reminder / Deadline</Label>
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
          title="Notes & Documents"
          description="Extra context, job description, and cover letter."
        />
        <div className="grid gap-5">
          <FormField>
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              placeholder="Paste the job description here…"
              rows={5}
              {...register("description")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="coverLetter">Cover Letter</Label>
            <Textarea
              id="coverLetter"
              placeholder="Your cover letter text…"
              rows={5}
              {...register("coverLetter")}
            />
          </FormField>

          <FormField>
            <Label htmlFor="notes">Personal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Anything else you want to remember…"
              rows={3}
              {...register("notes")}
            />
          </FormField>
        </div>
      </section>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
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
