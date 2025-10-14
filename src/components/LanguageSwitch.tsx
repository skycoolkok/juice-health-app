"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { locales, type Locale } from "@/app/i18n/config";

const SUPPORTED_LOCALE_SET = new Set<Locale>(locales);

type LanguageSwitchProps = {
  ariaLabel?: string;
};

export default function LanguageSwitch({ ariaLabel }: LanguageSwitchProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("lang");

  const nextLocale = locale === "en" ? "zh-Hant" : "en";
  const label = locale === "en" ? t("en") : t("zh");

  const handleSwitch = () => {
    const segments = pathname.split("/");

    if (SUPPORTED_LOCALE_SET.has(segments[1] as Locale)) {
      segments[1] = nextLocale;
    } else {
      segments.splice(1, 0, nextLocale);
    }

    const newPathname = segments.join("/") || "/";
    const search = searchParams.toString();
    const target = search ? `${newPathname}?${search}` : newPathname;

    router.replace(target);
  };

  return (
    <button
      type="button"
      onClick={handleSwitch}
      className="rounded-full border border-emerald-200 px-3 py-1 text-sm font-medium text-emerald-600 transition hover:border-emerald-300"
      aria-label={ariaLabel ?? t("switch")}
      title={ariaLabel ?? t("switch")}
    >
      {label}
    </button>
  );
}
