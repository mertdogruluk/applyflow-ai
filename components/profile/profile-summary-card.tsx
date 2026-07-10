import { Sparkles, Star, Wrench, CalendarClock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatDate } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SkillBadgeGroup } from "@/components/profile/skill-badge-group";

export interface ProfileSummaryData {
  coreSkills:        string[];
  toolsTech:         string[];
  yearsOfExperience: number;
  /** Kayıtlı profil gösterilirken dolu; taze analizde undefined. */
  updatedAt?: Date | null;
}

/**
 * AI'ın CV'den çıkardığı profili gösteren sonuç kartı.
 * core_skills → primary rozet (mavi), tools_and_tech → secondary rozet (gri).
 */
export function ProfileSummaryCard({ profile }: { profile: ProfileSummaryData }) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const years = profile.yearsOfExperience;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          {t("summaryTitle")}
        </CardTitle>
        <CardDescription>
          {profile.updatedAt
            ? t("summarySavedDesc", { date: formatDate(profile.updatedAt, locale) })
            : t("summaryFreshDesc")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center gap-2 text-sm">
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="font-medium">
            {years === 0 ? t("expNone") : t("expYears", { years })}
          </span>
        </div>

        <Separator />

        <SkillBadgeGroup
          title={t("coreSkills")}
          icon={Star}
          skills={profile.coreSkills}
          tone="primary"
          emptyText={t("noCoreSkills")}
        />

        <SkillBadgeGroup
          title={t("toolsTech")}
          icon={Wrench}
          skills={profile.toolsTech}
          tone="muted"
          emptyText={t("noTools")}
        />
      </CardContent>
    </Card>
  );
}
