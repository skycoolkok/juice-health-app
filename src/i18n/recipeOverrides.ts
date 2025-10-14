import type { Locale } from "@/app/i18n/config";

export type RecipeOverride = {
  title?: string;
  ingredients?: Array<{ name?: string }>;
  steps?: string[];
  description?: string;
  notes?: string;
};

export async function loadRecipeOverrides(
  id: string,
  locale: Locale,
  candidates: string[] = [],
): Promise<RecipeOverride | null> {
  const keys = Array.from(new Set([id, ...candidates].filter(Boolean)));
  for (const key of keys) {
    try {
      const data = (await import(`./recipes/${key}.${locale}.json`)).default;
      return data as RecipeOverride;
    } catch {
      continue;
    }
  }
  return null;
}
