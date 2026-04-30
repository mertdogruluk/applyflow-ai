import { PrismaClient } from "@prisma/client";

// Next.js hot-reload sırasında birden fazla PrismaClient instance açılmasını önler.
// Production'da her zaman yeni bir instance oluşturulur.
// Ref: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
