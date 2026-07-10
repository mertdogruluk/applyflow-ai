import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

/**
 * Cookie tabanlı locale (URL'de [locale] segmenti YOK — route yapısı ve
 * Clerk middleware'i hiç değişmez). NEXT_LOCALE cookie'si yoksa en.
 */
export const LOCALES = ["en", "tr"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("NEXT_LOCALE")?.value;
  const locale: AppLocale =
    cookieLocale === "tr" || cookieLocale === "en" ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
