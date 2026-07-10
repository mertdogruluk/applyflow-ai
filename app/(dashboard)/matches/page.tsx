import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Compass, Target } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchDashboard } from "@/components/matches/match-dashboard";
import { DiscoverPanel } from "@/components/matches/discover-panel";

export const metadata = { title: "Matches – ApplyFlow AI" };

export default async function MatchesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Profil var mı? (embedding şart değil — motor lazy backfill yapar)
  const profile = await prisma.candidateProfile.findUnique({
    where:  { userId },
    select: { userId: true },
  });
  const hasProfile = Boolean(profile);
  const t = await getTranslations("matches");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Tabs defaultValue="my-jobs">
        <TabsList>
          <TabsTrigger value="my-jobs">
            <Target />
            {t("tabMyJobs")}
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Compass />
            {t("tabDiscover")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-jobs">
          <MatchDashboard hasProfile={hasProfile} />
        </TabsContent>
        <TabsContent value="discover">
          <DiscoverPanel hasProfile={hasProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
