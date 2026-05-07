import type { ApplicationStatus } from "@prisma/client";
import { STATUS_CONFIG } from "@/lib/status";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.badge,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}
