"use client";

import { FormEvent, useEffect, useMemo, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createSharedPathnamesNavigation } from "next-intl/navigation";

import { RecipeCard, type RecipeSummary } from "@/components/RecipeCard";
import {
  FLAVOR_OPTIONS,
  LOCAL_FAVORITES_KEY,
  MAX_FAVORITES,
  MAX_NEW_RECIPES,
  SEARCH_DEBOUNCE_MS,
} from "../../home-constants";
import { locales, type Locale } from "../../i18n/config";

const { Link: LocaleLink } = createSharedPathnamesNavigation({ locales });

type RecipeResponse = {
  items: RecipeSummary[];
  error?: string;
};

type FetchState<T> = {
  loading: boolean;
  error: string | null;
  items: T;
};

type HomeClientProps = {
  initialNewRecipes: RecipeSummary[];
  initialFavoriteRecipes: RecipeSummary[];
};

const SEARCH_LIMIT = 9;

function persistLocalFavorites(items: RecipeSummary[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(items.slice(0, MAX_FAVORITES)));
  } catch (error) {
    console.warn("[home:favorites] failed to write local storage", error);
  }
}

export function HomeClient({ initialNewRecipes, initialFavoriteRecipes }: HomeClientProps) {
  const locale = useLocale() as Locale;
  const tAction = useTranslations("action");
  const tHome = useTranslations("home");
  const tState = useTranslations("state");
  const tError = useTranslations("error");
  const tFlavor = useTranslations("flavor");
  const tRecipes = useTranslations("recipes");

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchState, setSearchState] = useState<FetchState<RecipeSummary[]>>({ loading: false, error: null, items: [] });
  const [favorites, setFavorites] = useState<RecipeSummary[]>(() => initialFavoriteRecipes.slice(0, MAX_FAVORITES));
  const [newRecipes] = useState(() => initialNewRecipes.slice(0, MAX_NEW_RECIPES));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchState({ loading: false, error: null, items: [] });
      return undefined;
    }

    const controller = new AbortController();

    const run = async () => {
      setSearchState({ loading: true, error: null, items: [] });
      try {
        const params = new URLSearchParams({ query: debouncedQuery, limit: String(SEARCH_LIMIT) });
        const response = await fetch(`/api/recipes?${params.toString()}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? tError("fetchRecipes"));
        }
        const data: RecipeResponse = await response.json();
        setSearchState({ loading: false, error: null, items: data.items ?? [] });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[home] GET /api/recipes (search)", error);
        setSearchState({ loading: false, error: tError("fetchRecipes"), items: [] });
      }
    };

    run();
    return () => controller.abort();
  }, [debouncedQuery, tError]);

  const handleFavoriteToggle = useCallback((recipe: RecipeSummary) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === recipe.id);
      const next = exists ? prev.filter((item) => item.id !== recipe.id) : [recipe, ...prev];
      persistLocalFavorites(next);
      return next.slice(0, MAX_FAVORITES);
    });
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDebouncedQuery(query.trim());
  };

  const hasQuery = debouncedQuery.length > 0;
  const searchResultsLabel = useMemo(() => {
    if (searchState.loading) return tState("loading");
    if (!hasQuery) return tHome("searchHint");
    return `${tState("results")}: ${searchState.items.length}`;
  }, [hasQuery, searchState.items.length, searchState.loading, tHome, tState]);

  const newRecipeHint = tRecipes("cardHint");

  return (
    <div className="flex flex-col gap-12 pb-20">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-orange-50/30 p-8 shadow-lg sm:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] lg:items-start">
          <div className="space-y-8">
            <header className="space-y-4">
              <h1 className="text-4xl font-semibold text-emerald-900 sm:text-5xl">{tHome("heroTitle")}</h1>
              <p className="max-w-2xl text-base text-slate-600 sm:text-lg">{tHome("heroSubtitle")}</p>
            </header>

            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-emerald-800">{tHome("searchLabel")}</span>
                <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm sm:flex-row sm:items-center">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={tHome("searchPlaceholder")}
                    className="flex-1 rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    {tAction("search")}
                  </button>
                </div>
              </label>
              <p className="text-sm text-emerald-700">{tHome("searchHint")}</p>
            </form>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-700">{tHome("flavorTitle")}</h2>
              <div className="flex flex-wrap gap-2">
                {FLAVOR_OPTIONS.map((flavor) => (
                  <LocaleLink
                    key={flavor.value}
                    href={{ pathname: "/recipes", query: { flavor: flavor.value } }}
                    locale={locale}
                    className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    {tFlavor(flavor.label)}
                  </LocaleLink>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-inner">
            <p className="text-sm font-semibold text-emerald-800">{tState("results")}</p>
            <p className="text-3xl font-semibold text-emerald-900">{searchResultsLabel}</p>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                <span>{tHome("searchResultsSubtitle")}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-300" aria-hidden="true" />
                <span>{tHome("newSubtitle")}</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      {hasQuery ? (
        <section className="space-y-6 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-emerald-800">{tHome("searchResultsTitle")}</h2>
              <p className="text-sm text-slate-500">{tHome("searchResultsSubtitle")}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-700">{searchResultsLabel}</span>
          </div>
          {searchState.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{searchState.error}</p>
          ) : searchState.loading ? (
            <p className="text-sm text-slate-500">{tState("loading")}</p>
          ) : searchState.items.length === 0 ? (
            <p className="text-sm text-slate-500">{tHome("searchNone")}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {searchState.items.map((recipe) => (
                <RecipeCard
                  key={`search-${recipe.id}`}
                  recipe={recipe}
                  locale={locale}
                  isFavorite={favorites.some((item) => item.id === recipe.id)}
                  onToggleFavorite={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-8 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-emerald-800">{tHome("newTitle")}</h2>
            <p className="text-sm text-slate-500">{tHome("newSubtitle")}</p>
          </div>
          <LocaleLink
            href={{ pathname: "/recipes", query: { sort: "new" } }}
            locale={locale}
            className="rounded-full border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 transition hover:border-orange-300 hover:bg-orange-50"
          >
            {tAction("seeMore")}
          </LocaleLink>
        </div>

        {newRecipes.length === 0 ? (
          <p className="text-sm text-slate-500">{tHome("newEmpty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {newRecipes.map((recipe) => (
              <RecipeCard key={`new-${recipe.id}`} recipe={recipe} locale={locale} footerHint={newRecipeHint} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}







