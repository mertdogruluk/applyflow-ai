import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SkillTone = "primary" | "muted" | "critical" | "advantage";

/**
 * Ton → Badge görünümü eşlemesi.
 * critical/advantage: temada success token'ı olmadığı için advantage bilinçli
 * bir emerald istisnasıdır — yeni bir yerde "yeşil" gerekirse buradan türetin.
 */
const TONE_STYLES: Record<SkillTone, { variant: "default" | "secondary" | "destructive"; className?: string }> = {
  primary:   { variant: "default" },
  muted:     { variant: "secondary" },
  critical:  { variant: "destructive" },
  advantage: {
    variant:   "secondary",
    className: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
};

interface SkillBadgeGroupProps {
  title: string;
  icon: LucideIcon;
  skills: string[];
  /**
   * primary = ana yetenekler (tema mavisi) · muted = araçlar (gri)
   * critical = zorunlu ihtiyaçlar (kırmızımsı) · advantage = artılar (yeşilimsi)
   */
  tone: SkillTone;
  emptyText?: string;
}

/**
 * Başlık + rozet listesi. ProfileSummaryCard içinde core_skills ve
 * tools_and_tech için iki kez kullanılır; ileride job detayındaki
 * mustHaves/niceToHaves için de aynen işe yarar.
 */
export function SkillBadgeGroup({
  title,
  icon: Icon,
  skills,
  tone,
  emptyText = "Nothing extracted yet.",
}: SkillBadgeGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {title}
        <span className="font-normal normal-case">({skills.length})</span>
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <Badge
              key={skill}
              variant={TONE_STYLES[tone].variant}
              className={cn(TONE_STYLES[tone].className)}
            >
              {skill}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
