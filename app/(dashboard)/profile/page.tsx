import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getCandidateProfile } from "@/lib/queries/profile";
import { CvUploadSection } from "@/components/profile/cv-upload-section";

export const metadata = { title: "Career Profile – ApplyFlow AI" };

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await getCandidateProfile(userId);
  const t = await getTranslations("profile");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <CvUploadSection
        initialProfile={
          profile
            ? {
                coreSkills:        profile.coreSkills,
                toolsTech:         profile.toolsTech,
                yearsOfExperience: profile.yearsOfExperience,
                updatedAt:         profile.updatedAt,
              }
            : null
        }
      />
    </div>
  );
}
