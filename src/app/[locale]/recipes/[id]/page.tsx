import { TagType } from "@prisma/client";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import RecipeDetailClient from "./_components/RecipeDetailClient";
import { prisma } from "@/lib/prisma";
import { ensureRecipeTotals, type RecipeWithNutrition } from "@/lib/recipe-totals";
import { NUTRIENT_KEYS, NUTRIENT_META } from "@/lib/nutrient-meta";
import { getRecipeMeta } from "@/lib/recipeMeta";
import { loadRdiRecords, resolveUserContext } from "@/lib/rdi";
import { getRecipeTranslation } from "@/lib/recipeTranslations";
import { loadRecipeOverrides } from "@/i18n/recipeOverrides";
import { formatQty, formatUnit } from "@/i18n/units";
import type { NutritionTranslationKey } from "@/i18n/recipes";
import { locales, type Locale } from "@/app/i18n/config";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _KeepTagType = TagType;

const GRADIENTS = [
  "from-emerald-200 via-emerald-100 to-emerald-300",
  "from-orange-200 via-amber-100 to-orange-300",
  "from-lime-200 via-green-100 to-lime-300",
  "from-teal-200 via-cyan-100 to-teal-300",
] as const;

type PageParams = {
  id: string;
  locale: string;
};

type PageProps = {
  params: PageParams;
};

type TagsPayload = {
  functional: string[];
  flavor: string[];
};

function splitText(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n|[。．\.]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function mergeTags(meta: TagsPayload | undefined, dbFunctional: string[], dbFlavor: string[]): TagsPayload {
  const functional = new Set<string>((meta?.functional ?? []).map((tag) => tag.toUpperCase()));
  const flavor = new Set<string>((meta?.flavor ?? []).map((tag) => tag.toUpperCase()));

  for (const tag of dbFunctional) {
    if (tag) functional.add(tag.toUpperCase());
  }
  for (const tag of dbFlavor) {
    if (tag) flavor.add(tag.toUpperCase());
  }

  return {
    functional: Array.from(functional),
    flavor: Array.from(flavor),
  };
}

function slugify(value: string | null | undefined): string | null {
  if (!value) return null;
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || null
  );
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const recipeId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(recipeId)) {
    notFound();
  }

  // ✅ 更新：不再 include ingredient.nutrition；只取到 name、id、default_unit
  const recipePromise = prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });

  const metaPromise = getRecipeMeta();
  const contextPromise = resolveUserContext();

  const [recipeRecord, metaMap, context] = await Promise.all([recipePromise, metaPromise, contextPromise]);

  if (!recipeRecord) {
    notFound();
  }

  const routeLocale = params.locale;
  const locale = locales.includes(routeLocale as Locale) ? (routeLocale as Locale) : ((await getLocale()) as Locale);

  const nameSlug = slugify(recipeRecord.name);
  const overrides = await loadRecipeOverrides(String(recipeRecord.id), locale, nameSlug ? [nameSlug] : []);
  const translation = getRecipeTranslation(recipeRecord.id, locale);
  const displayName = overrides?.title ?? translation?.name ?? recipeRecord.name ?? "";
  const displayDescription = overrides?.description ?? translation?.description ?? recipeRecord.description?.trim() ?? null;
  const displayCategory = translation?.category ?? recipeRecord.category ?? null;

  const gradient = GRADIENTS[recipeRecord.id % GRADIENTS.length];
  const initial = displayName.charAt(0).toUpperCase() || "J";

  const dbFunctional = recipeRecord.tags
    .filter((item) => item.tag?.type === "functional" && item.tag?.name)
    .map((item) => item.tag!.name);
  const dbFlavor = recipeRecord.tags
    .filter((item) => item.tag?.type === "flavor" && item.tag?.name)
    .map((item) => item.tag!.name);
  const tags = mergeTags(metaMap[recipeRecord.id], dbFunctional, dbFlavor);

  // ✅ 這裡改讀 RecipeIngredient.amount + Ingredient.default_unit
  const ingredients = await Promise.all(
    recipeRecord.ingredients.map(async (item, index) => {
      const overrideName = overrides?.ingredients?.[index]?.name;
      const name = overrideName ?? item.ingredient?.name ?? "";

      const quantity =
        typeof item.amount === "number" && Number.isFinite(item.amount) ? item.amount : null;

      const unit = item.ingredient?.unit ?? null;
      const unitLabel = unit ? await formatUnit(unit, locale) : "";

      return {
        name,
        quantity,
        unit,
        unitLabel,
        displayQuantity: await formatQty(quantity, unit, locale),
      };
    }),
  );

  const descriptionSteps = splitText(recipeRecord.description);
  const noteSteps = splitText(recipeRecord.notes);
  const baseSteps = noteSteps.length > 0 ? noteSteps : descriptionSteps;
  const steps = overrides?.steps ?? baseSteps;

  const totals = await ensureRecipeTotals({
    recipeId,
    recipe: recipeRecord as RecipeWithNutrition,
  });

  const rdiRecords = await loadRdiRecords({ age: context.age, sex: context.sex });
  const percentOfDaily = NUTRIENT_KEYS.reduce<Record<string, number | null>>((acc, key) => {
    const perServingValue = totals.perServing?.[key] ?? null;
    const dailyValue = rdiRecords[key]?.daily ?? null;
    if (perServingValue === null || dailyValue === null || dailyValue === 0) {
      acc[key] = null;
    } else {
      acc[key] = (perServingValue / dailyValue) * 100;
    }
    return acc;
  }, {});

  const canPersistFavorite = context.userId !== null && context.userId !== undefined;

  let isFavorite = false;
  if (canPersistFavorite) {
    const favoriteRecord = await prisma.favorite.findUnique({
      where: {
        user_id_recipe_id: {
          user_id: context.userId,
          recipe_id: recipeRecord.id,
        },
      },
    });
    isFavorite = Boolean(favoriteRecord);
  }

  const servings =
    typeof recipeRecord.servings === "number" && Number.isFinite(recipeRecord.servings)
      ? recipeRecord.servings
      : 1;

  const t = await getTranslations({ locale, namespace: "recipe" });
  type TranslationKeyPath = Parameters<typeof t>[0];

  const NUTRITION_TRANSLATION_MAP: Record<string, NutritionTranslationKey> = {
    calories_kcal: "calories",
    protein_g: "protein",
    fat_g: "fat",
    carbs_g: "carbohydrates",
    fiber_g: "fiber",
    vitamin_c_mg: "vitaminC",
    vitamin_a_ug: "vitaminA",
    iron_mg: "iron",
    calcium_mg: "calcium",
    potassium_mg: "potassium",
    sodium_mg: "sodium",
  };

  const nutritionCards = await Promise.all(
    NUTRIENT_KEYS.map(async (key) => {
      const meta = NUTRIENT_META[key];
      const total = totals.totals[key] ?? null;
      const perServing = totals.perServing ? totals.perServing[key] ?? null : null;
      const unit = await formatUnit(meta.unit, locale);
      const translationKey = NUTRITION_TRANSLATION_MAP[key] ?? "calories";
      let label: string = meta.label;
      if (translationKey) {
        try {
          const keyForI18n = `nutrition.${translationKey}` as const;
          keyForI18n satisfies `nutrition.${NutritionTranslationKey}`;
          label = String(t(keyForI18n as TranslationKeyPath));
        } catch {
          label = meta.label;
        }
      }
      return {
        key,
        label,
        unit,
        total,
        perServing,
      };
    }),
  );

  return (
    <RecipeDetailClient
      locale={locale}
      copy={{
        sections: {
          ingredients: t("sections.ingredients"),
          steps: t("sections.steps"),
          nutrition: t("sections.nutrition"),
        },
        labels: {
          back: t("labels.back"),
          perRecipe: t("labels.perRecipe"),
          perServing: t("labels.perServing"),
          servings: t("labels.servings"),
        },
      }}
      recipe={{
        id: recipeRecord.id,
        name: displayName,
        description: displayDescription,
        category: displayCategory,
        servings,
        gradient,
        initial,
      }}
      tags={tags}
      ingredients={ingredients}
      nutrition={{
        totals: totals.totals,
        perServing: totals.perServing,
        percentOfDaily,
        cards: nutritionCards,
      }}
      favorite={{
        canPersist: canPersistFavorite,
        isFavorite,
      }}
      steps={steps}
    />
  );
}
