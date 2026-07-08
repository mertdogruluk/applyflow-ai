import { Sparkles, Star, Wrench, CalendarClock } from "lucide-react";

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
  const years = profile.yearsOfExperience;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          AI Profile Summary
        </CardTitle>
        <CardDescription>
          {profile.updatedAt
            ? `Extracted from your CV · last updated ${profile.updatedAt.toLocaleDateString()}`
            : "Freshly extracted from your CV."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center gap-2 text-sm">
          <CalendarClock className="size-4 text-muted-foreground" />
          <span className="font-medium">
            {years === 0 ? "Experience not stated" : `${years} ${years === 1 ? "year" : "years"} of experience`}
          </span>
        </div>

        <Separator />

        <SkillBadgeGroup
          title="Core skills"
          icon={Star}
          skills={profile.coreSkills}
          tone="primary"
          emptyText="No high-level skills were found in the CV."
        />

        <SkillBadgeGroup
          title="Tools & technologies"
          icon={Wrench}
          skills={profile.toolsTech}
          tone="muted"
          emptyText="No specific tools were found in the CV."
        />
      </CardContent>
    </Card>
  );
}
