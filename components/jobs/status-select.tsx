"use client";

import { useState, useTransition } from "react";
import type { ApplicationStatus } from "@prisma/client";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { STATUS_CONFIG, STATUS_VALUES } from "@/lib/status";
import { updateJobStatus } from "@/app/(dashboard)/jobs/actions";
import { cn } from "@/lib/utils";

interface StatusSelectProps {
  jobId: string;
  status: ApplicationStatus;
  /** "badge" liste için kompakt rozet stili, "default" form içinde normal select */
  variant?: "badge" | "default";
}

export function StatusSelect({ jobId, status, variant = "badge" }: StatusSelectProps) {
  const [current, setCurrent] = useState<ApplicationStatus>(status);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();
  const cfg = STATUS_CONFIG[current];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as ApplicationStatus;
    const prev = current;
    setCurrent(next); // optimistic
    startTransition(async () => {
      try {
        await updateJobStatus({ jobId, status: next });
      } catch {
        setCurrent(prev); // rollback on failure
      }
    });
  };

  if (variant === "badge") {
    return (
      <span
        className={cn(
          "relative inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
          cfg.badge,
          isPending && "opacity-70",
        )}
      >
        {t(`status.${current}`)}
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-60" />
        )}
        <select
          aria-label={t("jobs.updateStatus")}
          className="absolute inset-0 cursor-pointer opacity-0"
          value={current}
          onChange={handleChange}
          disabled={isPending}
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`status.${value}`)}
            </option>
          ))}
        </select>
      </span>
    );
  }

  return (
    <select
      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      value={current}
      onChange={handleChange}
      disabled={isPending}
    >
      {STATUS_VALUES.map((value) => (
        <option key={value} value={value}>
          {t(`status.${value}`)}
        </option>
      ))}
    </select>
  );
}
