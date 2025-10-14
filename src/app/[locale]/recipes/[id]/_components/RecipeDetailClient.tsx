"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createSharedPathnamesNavigation } from "next-intl/navigation";

import { locales, type Locale } from "@/app/i18n/config";

const { Link: LocaleLink } = createSharedPathnamesNavigation({ locales });

type IngredientRow = {
  name: string;
  quantity: number | null;
  unit: string | null;
  unitLabel: string;
  displayQuantity: string;
};

type NutritionCard = {
  key: string;
  label: string;
  unit: string;
  total: number | null;
  perServing: number | null;
};

type NutritionPayload = {
  totals: Record<string, number | null>;
  perServing: Record<string, number | null> | null;
  percentOfDaily: Record<string, number | null>;
  cards: NutritionCard[];
};

type FavoriteState = {
  canPersist: boolean;
  isFavorite: boolean;
};

type SectionCopy = {
  sections: {
    ingredients: string;
    steps: string;
    nutrition: string;
  };
  labels: {
    servings: string;
    back: string;
    perServing: string;
    perRecipe: string;
  };
};

type RecipeDetailClientProps = {
  locale: Locale;
  copy: SectionCopy;
  recipe: {
    id: number;
    name: string;
    description: string | null;
    category: string | null;
    servings: number;
    gradient: string;
    initial: string;
  };
  tags: {
    functional: string[];
    flavor: string[];
  };
  ingredients: IngredientRow[];
  nutrition: NutritionPayload;
  favorite: FavoriteState;
  steps: string[];
};

function formatAmount(value: number | null, formatter: Intl.NumberFormat): string {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return formatter.format(rounded);
}

function formatAmountWithUnit(
  value: number | null,
  unitLabel: string,
  formatter: Intl.NumberFormat,
  fallback: string,
): string {
  if (value === null || Number.isNaN(value)) {
    return fallback || unitLabel || "--";
  }
  const formatted = formatAmount(value, formatter);
  return unitLabel ? `${formatted} ${unitLabel}` : formatted;
}

export default function RecipeDetailClient({
  locale,
  copy,
  recipe,
  tags,
  ingredients,
  nutrition,
  favorite,
  steps,
}: RecipeDetailClientProps) {
  const tDetail = useTranslations("recipeDetail");
  const tAction = useTranslations("action");
  const tFlavor = useTranslations("flavor");
  const tFunctional = useTranslations("functional");

  const [multiplier, setMultiplier] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState<boolean>(favorite.isFavorite);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }), [locale]);
  const percentFormatter = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }), [locale]);

  const baseServings = recipe.servings > 0 ? recipe.servings : 1;

  const scaledIngredients = useMemo(() => {
    return ingredients.map((item) => {
      const scaledQuantity =
        item.quantity === null || Number.isNaN(item.quantity) ? null : item.quantity * multiplier;
      return {
        ...item,
        scaledQuantity,
        scaledDisplay: formatAmountWithUnit(scaledQuantity, item.unitLabel, numberFormatter, item.displayQuantity),
      };
    });
  }, [ingredients, multiplier, numberFormatter]);

  const translatedTags = useMemo(() => {
    const functionalTags = tags.functional.map((tag) => (
      tFunctional.has(tag) ? tFunctional(tag) : tag.replace(/_/g, " ")
    ));
    const flavorTags = tags.flavor.map((tag) => {
      const lower = tag.toLowerCase();
      return tFlavor.has(lower) ? tFlavor(lower) : tag.replace(/_/g, " ");
    });
    return [...functionalTags, ...flavorTags];
  }, [tags.functional, tags.flavor, tFlavor, tFunctional]);

  const handleMultiplierChange = (value: number) => {
    if (Number.isNaN(value) || value <= 0) {
      return;
    }
    setMultiplier(value);
  };

  const handleAddToToday = async () => {
    setAdding(true);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id, multiplier }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setStatusMessage({ type: "success", text: tDetail("addSuccess") });
    } catch (error) {
      console.error("[recipe-detail] add to today", error);
      setStatusMessage({ type: "error", text: tDetail("addError") });
    } finally {
      setAdding(false);
    }
  };

  const handleFavoriteToggle = async () => {
    const nextState = !isFavorite;
    if (!favorite.canPersist) {
      setIsFavorite(nextState);
      setStatusMessage({
        type: "success",
        text: nextState ? tDetail("favoriteAdded") : tDetail("favoriteRemoved"),
      });
      return;
    }

    setFavoriteLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: nextState }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setIsFavorite(nextState);
      setStatusMessage({
        type: "success",
        text: nextState ? tDetail("favoriteAdded") : tDetail("favoriteRemoved"),
      });
    } catch (error) {
      console.error("[recipe-detail] favorite", error);
      setStatusMessage({ type: "error", text: tDetail("favoriteError") });
    } finally {
      setFavoriteLoading(false);
    }
  };

  const percentValue = (key: string) => {
    const percent = nutrition.percentOfDaily[key] ?? null;
    if (percent === null || Number.isNaN(percent)) {
      return tDetail("rdiNA");
    }
    return tDetail("rdiLabel", { value: percentFormatter.format(percent) });
  };

  return (
    <div className="space-y-10">
      <LocaleLink
        href="/recipes"
        locale={locale}
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
      >
        {copy.labels.back}
      </LocaleLink>

      <header className="space-y-6 rounded-3xl bg-white p-8 shadow-sm">
        <div
          className={`relative h-52 w-full overflow-hidden rounded-2xl bg-gradient-to-br ${recipe.gradient}`}
          aria-hidden="true"
        >
          <span className="absolute inset-0 flex items-center justify-center text-6xl font-semibold text-white/80">
            {recipe.initial}
          </span>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-emerald-700 sm:text-4xl">{recipe.name}</h1>
          <p className="text-sm text-slate-600">
            {recipe.description ?? tDetail("descriptionEmpty")}
          </p>
          {recipe.servings ? (
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
              {copy.labels.servings}: {tDetail("servings", { count: recipe.servings })}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-700">
            {recipe.category ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium uppercase tracking-wide text-emerald-600">
                {recipe.category}
              </span>
            ) : null}
            {translatedTags.map((tag) => (
              <span key={`${recipe.id}-${tag}`} className="rounded-full bg-emerald-50 px-3 py-1 font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 space-y-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-emerald-700">{tDetail("multiplierLabel")}</span>
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={multiplier}
                onChange={(event) => handleMultiplierChange(Number(event.target.value))}
                className="w-32 rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <p className="text-xs text-slate-500">
              {tDetail("servingsFor", { count: numberFormatter.format(baseServings * multiplier) })}
            </p>
            <p className="text-xs text-slate-500">{tDetail("multiplierHint")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleAddToToday}
              disabled={adding}
              className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition ${
                adding ? "bg-emerald-300" : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {adding ? tDetail("adding") : tAction("addToToday")}
            </button>
            <button
              type="button"
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                isFavorite
                  ? "border border-orange-300 bg-orange-50 text-orange-600"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
              }`}
              title={!favorite.canPersist ? tDetail("favoriteUnavailable") : undefined}
            >
              {favoriteLoading
                ? "..."
                : isFavorite
                  ? tAction("unfavorite")
                  : tAction("favorite")}
            </button>
          </div>
        </div>
        {statusMessage ? (
          <p
            className={`rounded-2xl px-4 py-2 text-sm ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {statusMessage.text}
          </p>
        ) : !favorite.canPersist ? (
          <p className="text-xs text-slate-400">{tDetail("favoriteUnavailable")}</p>
        ) : null}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <header>
            <h2 className="text-xl font-semibold text-emerald-700">{copy.sections.ingredients}</h2>
            <p className="text-xs text-slate-500">{tDetail("ingredientsHint")}</p>
          </header>
          <ul className="space-y-3 text-sm text-slate-600">
            {scaledIngredients.map((item, index) => (
              <li key={`${item.name}-${index}`} className="flex justify-between gap-4">
                <span>{item.name}</span>
                <span className="text-slate-500">{item.scaledDisplay}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-emerald-700">{copy.sections.steps}</h2>
          {steps.length === 0 ? (
            <p className="text-sm text-slate-500">{tDetail("stepsEmpty")}</p>
          ) : (
            <ol className="space-y-3 text-sm text-slate-600">
              {steps.map((step, index) => (
                <li key={`${recipe.id}-step-${index}`} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="space-y-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-emerald-700">{copy.sections.nutrition}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nutrition.cards.map((card) => {
            const totalText = formatAmountWithUnit(card.total, card.unit, numberFormatter, "--");
            const perServingText = formatAmountWithUnit(card.perServing, card.unit, numberFormatter, "--");
            return (
              <div key={card.key} className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-slate-600">
                <p className="text-base font-semibold text-emerald-700">{card.label}</p>
                <p className="text-xs text-slate-500">{copy.labels.perRecipe}</p>
                <p className="text-lg font-semibold text-slate-800">{totalText}</p>
                <p className="text-xs text-slate-500">
                  {copy.labels.perServing}: {perServingText}
                </p>
                <p className="text-xs text-slate-400">
                  {tDetail("nutritionDaily")}: {percentValue(card.key)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
