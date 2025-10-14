"use client";

import type { ComponentProps } from "react";

import { useLocale, useTranslations } from "next-intl";
import { createSharedPathnamesNavigation } from "next-intl/navigation";

import { locales, type Locale } from "@/app/i18n/config";
import { getRecipeTranslation } from "@/lib/recipeTranslations";

const { Link: LocaleLink } = createSharedPathnamesNavigation({ locales });
type LocaleLinkProps = ComponentProps<typeof LocaleLink>;
type RecipeCardHref = LocaleLinkProps["href"];

export type RecipeSummary = {
  id: number;
  name: string;
  category: string | null;
  servings: number | null;
  ingredientIds?: number[];
  functionalTags?: string[];
  flavorTags?: string[];
  missingIngredientNames?: string[];
};

export type RecipeCardProps = {
  recipe: RecipeSummary;
  href?: RecipeCardHref;
  locale?: Locale;
  footerHint?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (recipe: RecipeSummary) => void;
  className?: string;
};

const gradients = [
  "from-emerald-200 via-emerald-100 to-emerald-300",
  "from-orange-200 via-amber-100 to-orange-300",
  "from-lime-200 via-green-100 to-lime-300",
  "from-teal-200 via-cyan-100 to-teal-300",
];

const flavorKeySet = new Set(["sour", "sweet", "bitter", "herbal", "fresh", "rich", "strong"]);
const functionalKeySet = new Set(["FOR_DIET", "FOR_BEAUTY", "DETOX", "ENERGY"]);

export function RecipeCard({
  recipe,
  href,
  locale: localeProp,
  footerHint,
  isFavorite = false,
  onToggleFavorite,
  className,
}: RecipeCardProps) {
  const localeFromHook = useLocale() as Locale;
  const locale = localeProp ?? localeFromHook;
  const translation = getRecipeTranslation(recipe.id, locale);
  const name = translation?.name ?? recipe.name;
  const category = translation?.category ?? recipe.category;

  const tFlavor = useTranslations("flavor");
  const tFunctional = useTranslations("functional");
  const tAction = useTranslations("action");
  const tRecipes = useTranslations("recipes");

  const gradient = gradients[recipe.id % gradients.length];
  const initial = name?.charAt(0)?.toUpperCase() ?? "J";

  const tags = [...(recipe.functionalTags ?? []), ...(recipe.flavorTags ?? [])]
    .slice(0, 3)
    .map((tag) => {
      const lower = tag.toLowerCase();
      if (flavorKeySet.has(lower)) {
        return tFlavor(lower);
      }
      if (functionalKeySet.has(tag)) {
        return tFunctional(tag);
      }
      return tag.replace(/_/g, " ");
    });

  const servingsLabel = recipe.servings ? tRecipes("servingsLabel", { count: recipe.servings }) : null;

  const baseClasses =
    "flex h-full flex-col gap-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl";
  const cardClasses = className ? `${baseClasses} ${className}` : baseClasses;

  const body = (
    <article className={cardClasses}>
      <div
        className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br ${gradient}`}
        aria-hidden="true"
      >
        <span className="absolute inset-0 flex items-center justify-center text-5xl font-semibold text-white/80">
          {initial}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {category ? (
          <span className="text-xs font-medium uppercase tracking-wide text-emerald-500">{category}</span>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-emerald-800">{name}</h3>
            {servingsLabel ? <p className="text-xs text-slate-500">{servingsLabel}</p> : null}
          </div>
          {onToggleFavorite ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleFavorite(recipe);
              }}
              className={
                isFavorite
                  ? "rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600"
                  : "rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-orange-300 hover:text-orange-500"
              }
            >
              {isFavorite ? tAction("unfavorite") : tAction("favorite")}
            </button>
          ) : null}
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs text-emerald-700">
            {tags.map((tag) => (
              <span key={`${recipe.id}-${tag}`} className="rounded-full bg-emerald-50 px-2 py-1 font-medium">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {footerHint ? <p className="mt-auto text-xs text-slate-500">{footerHint}</p> : null}
      </div>
    </article>
  );

  const linkHref: RecipeCardHref = href ?? `/recipes/${recipe.id}`;

  return (
    <LocaleLink href={linkHref} locale={locale} className="block h-full">
      {body}
    </LocaleLink>
  );
}

export default RecipeCard;
