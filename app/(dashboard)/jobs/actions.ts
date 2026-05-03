"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { jobFormSchema } from "@/lib/validations/job";

export async function createJob(rawData: unknown) {
  // 1. Auth — kullanıcı giriş yapmamışsa işlem yapma
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: You must be signed in to create a job.");
  }

  // 2. Validate
  const parsed = jobFormSchema.safeParse(rawData);
  if (!parsed.success) {
    // Tüm hata mesajlarını birleştir
    const messages = parsed.error.issues.map((e) => e.message).join(", ");
    throw new Error(`Validation failed: ${messages}`);
  }

  const data = parsed.data;

  // 3. Veritabanına kaydet
  await prisma.job.create({
    data: {
      userId,
      title:       data.title,
      company:     data.company,
      status:      data.status,
      location:    data.location,
      workType:    data.workType ?? "HYBRID",
      jobType:     data.jobType  ?? "FULL_TIME",
      jobUrl:      data.url,
      salary:      data.salaryRange,
      source:      data.source,
      description: data.description,
      notes:       data.notes,
      cvVersion:   data.cvVersion,
      coverLetter: data.coverLetter,
      appliedAt:   data.appliedAt,
      deadline:    data.reminderDate,
    },
  });

  // 4. Başarıda /jobs sayfasına yönlendir
  redirect("/jobs");
}
