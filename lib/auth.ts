import { auth } from "@clerk/nextjs/server";

/**
 * Server-side guard: oturum yoksa hata fırlatır.
 * Server Action ve Route Handler içinde kullan.
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: You must be signed in.");
  }
  return userId;
}
