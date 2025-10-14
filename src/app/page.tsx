import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { defaultLocale, locales, type Locale } from "./i18n/config";

export default async function RootPage() {
  let locale: Locale = defaultLocale;

  try {
    const detected = await getLocale();
    if (locales.includes(detected as Locale)) {
      locale = detected as Locale;
    }
  } catch {
    // fall back to defaultLocale
  }

  redirect(`/${locale}`);
}
