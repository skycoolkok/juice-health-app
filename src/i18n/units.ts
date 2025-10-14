import { getTranslations } from "next-intl/server";

import type { Locale } from "@/app/i18n/config";

export async function formatUnit(unit: string, locale: Locale) {
  const key = unit.toLowerCase();
  const t = await getTranslations({ locale, namespace: "recipe.units" });
  try {
    return t(key);
  } catch {
    return unit;
  }
}

export async function formatQty(
  value: number | string | null | undefined,
  unit: string | null | undefined,
  locale: Locale,
) {
  if (value == null && !unit) return "";
  const v = value == null ? "" : String(value);
  const u = unit ? await formatUnit(unit, locale) : "";
  return [v, u].filter(Boolean).join(" ");
}
