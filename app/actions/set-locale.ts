"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { LOCALES, type AppLocale } from "@/i18n/request";

/** Dil tercihini cookie'ye yazar; layout revalidate edilir, sayfa yeni dilde gelir. */
export async function setLocale(locale: AppLocale) {
  if (!LOCALES.includes(locale)) return;

  const store = await cookies();
  store.set("NEXT_LOCALE", locale, {
    path:   "/",
    maxAge: 60 * 60 * 24 * 365, // 1 yıl
  });

  revalidatePath("/", "layout");
}
