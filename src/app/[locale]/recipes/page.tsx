"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createSharedPathnamesNavigation } from "next-intl/navigation";

import { RecipeCard, type RecipeSummary } from "@/components/RecipeCard";
import tagsConfig from "../../../data/tags.json";
import { locales, type Locale } from "../../i18n/config";

const { Link: LocaleLink } = createSharedPathnamesNavigation({ locales });

type FunctionalKey = "FOR_DIET" | "FOR_BEAUTY" | "DETOX" | "ENERGY";
type FlavorKey = "SOUR" | "SWEET" | "BITTER" | "HERBAL" | "FRESH" | "STRONG";

const FUNCTIONAL_ALIASES: Record<string, FunctionalKey> = {
  FOR_DIET: "FOR_DIET",
  DIET: "FOR_DIET",
  FOR_BEAUTY: "FOR_BEAUTY",
  BEAUTY: "FOR_BEAUTY",
  DETOX: "DETOX",
  ENERGY: "ENERGY",
};

const FLAVOR_ALIASES: Record<string, FlavorKey> = {
  SOUR: "SOUR",
  SWEET: "SWEET",
  BITTER: "BITTER",
  HERBAL: "HERBAL",
  FRESH: "FRESH",
  STRONG: "STRONG",
};

type FilterOption = {
  value: string;
  label: string;
};

type RecipeResponse = {
  items: RecipeSummary[];
  error?: string;
};

const formatTagFallback = (tag: string) => tag.replace(/[_-]/g, " ");

const mapOptions = (source: unknown): string[] => {
  if (!Array.isArray(source)) return [];
  return source
    .map((entry) => (typeof entry === "string" ? entry : String(entry ?? "")))
    .filter((entry) => entry.trim().length > 0);
};

const functionalSource = mapOptions((tagsConfig as { functional?: unknown }).functional);
const flavorSource = mapOptions((tagsConfig as { flavor?: unknown }).flavor);

export default function RecipesPage() {
  const locale = useLocale() as Locale;
  const tRecipes = useTranslations("recipes");
  const tAction = useTranslations("action");
  const tError = useTranslations("error");
  const tFlavor = useTranslations("flavor");
  const tFunctional = useTranslations("functional");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [queryInput, setQueryInput] = useState(searchParams.get("query") ?? "");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = (searchParams.get("query") ?? "").trim();
  const functionalParam = searchParams.get("tag") ?? searchParams.get("functional") ?? "";
  const flavorParam = searchParams.get("flavor") ?? "";

  const activeFunctionalTag = functionalParam
    ? FUNCTIONAL_ALIASES[functionalParam.toUpperCase()] ?? functionalParam.toUpperCase()
    : "";
  const activeFlavorTag = flavorParam
    ? FLAVOR_ALIASES[flavorParam.toUpperCase()] ?? flavorParam.toUpperCase()
    : "";

  useEffect(() => {
    setQueryInput(query);
  }, [query]);

  const functionalOptions = useMemo<FilterOption[]>(() => {
    const map = new Map<string, string>();
    for (const rawTag of functionalSource) {
      const normalized = FUNCTIONAL_ALIASES[rawTag.toUpperCase()] ?? rawTag.toUpperCase();
      if (map.has(normalized)) continue;
      const label = tFunctional.has(normalized) ? tFunctional(normalized) : formatTagFallback(rawTag);
      map.set(normalized, label);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [tFunctional]);

  const flavorOptions = useMemo<FilterOption[]>(() => {
    const map = new Map<string, string>();
    for (const rawTag of flavorSource) {
      const normalized = FLAVOR_ALIASES[rawTag.toUpperCase()] ?? rawTag.toUpperCase();
      if (map.has(normalized)) continue;
      const lowerKey = normalized.toLowerCase();
      const label = tFlavor.has(lowerKey) ? tFlavor(lowerKey) : formatTagFallback(rawTag);
      map.set(normalized, label);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [tFlavor]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRecipes = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query) params.set("query", query);
        if (activeFunctionalTag) params.set("tag", activeFunctionalTag);
        if (activeFlavorTag) params.set("flavor", activeFlavorTag);
        const queryString = params.toString();
        const url = queryString ? `/api/recipes?${queryString}` : "/api/recipes";
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        if (!response.ok) {
          throw new Error(tError("fetchRecipes"));
        }
        const data: RecipeResponse = await response.json();
        setRecipes(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("[/recipes] fetch", err);
        setRecipes([]);
        setError(tError("fetchRecipes"));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRecipes();
    return () => controller.abort();
  }, [query, activeFunctionalTag, activeFlavorTag, tError]);

  const updateParam = (key: string, value: string | null, aliases: string[] = []) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    aliases.forEach((alias) => {
      if (alias !== key) nextParams.delete(alias);
    });

    if (value && value.trim()) {
      nextParams.set(key, value.trim());
    } else {
      [key, ...aliases].forEach((alias) => nextParams.delete(alias));
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParam("query", queryInput);
  };

  const clearFilters = () => {
    setQueryInput("");
    setRecipes([]);
    setError(null);
    router.replace(pathname, { scroll: false });
  };

  const hasActiveFilters = Boolean(query || activeFunctionalTag || activeFlavorTag);
  const resultCountLabel = useMemo(
    () => tRecipes("resultsCount", { count: recipes.length }),
    [recipes.length, tRecipes],
  );
  const emptyStateMessage = hasActiveFilters ? tRecipes("empty") : tRecipes("prompt");
  const cardHint = tRecipes("cardHint");

  return (
    <div className="space-y-12">
      <section className="space-y-8 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-emerald-700 sm:text-4xl">{tRecipes("title")}</h1>
          <p className="text-sm text-slate-600 sm:text-base">{tRecipes("subtitle")}</p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:flex-row sm:items-center"
        >
          <label className="flex-1 text-sm text-slate-600">
            <span className="sr-only">{tRecipes("searchPlaceholder")}</span>
            <input
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder={tRecipes("searchPlaceholder")}
              className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600 disabled:bg-emerald-300"
              disabled={loading}
            >
              {tAction("search")}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!hasActiveFilters && !queryInput}
            >
              {tAction("clear")}
            </button>
          </div>
        </form>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              {tRecipes("functionalTitle")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {functionalOptions.map((option) => {
                const active = activeFunctionalTag === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateParam("tag", active ? null : option.value, ["functional"])}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                      active
                        ? "border-emerald-500 bg-emerald-500 text-white shadow"
                        : "border border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-orange-500">
              {tRecipes("flavorTitle")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {flavorOptions.map((option) => {
                const active = activeFlavorTag === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateParam("flavor", active ? null : option.value)}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                      active
                        ? "border-orange-500 bg-orange-500 text-white shadow"
                        : "border border-orange-200 bg-white text-orange-600 hover:border-orange-400 hover:bg-orange-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-600">{resultCountLabel}</p>
            {hasActiveFilters ? (
              <p className="text-xs text-slate-500">{cardHint}</p>
            ) : (
              <p className="text-xs text-slate-500">{tRecipes("prompt")}</p>
            )}
          </div>
          <LocaleLink
            href="/rdi-tracker"
            locale={locale}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            {tRecipes("linkRdi")}
          </LocaleLink>
        </div>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="text-sm text-slate-500">{tRecipes("loading")}</p>
        ) : recipes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            {emptyStateMessage}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} locale={locale} footerHint={cardHint} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
