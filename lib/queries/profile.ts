import { prisma } from "@/lib/prisma";

/**
 * Kayıtlı aday profilini getirir (yoksa null).
 * cvText bilinçli olarak seçilmez — sayfa yalnızca özet gösterir,
 * ham CV'yi client'a taşımanın gereği yok.
 */
export async function getCandidateProfile(userId: string) {
  return prisma.candidateProfile.findUnique({
    where:  { userId },
    select: {
      coreSkills:        true,
      toolsTech:         true,
      yearsOfExperience: true,
      updatedAt:         true,
    },
  });
}
