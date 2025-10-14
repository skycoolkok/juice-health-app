export const FLAVOR_OPTIONS = [
  { label: "sour", value: "SOUR" },
  { label: "sweet", value: "SWEET" },
  { label: "bitter", value: "BITTER" },
  { label: "herbal", value: "HERBAL" },
  { label: "fresh", value: "FRESH" },
  { label: "rich", value: "STRONG" },
] as const;

export const LOCAL_FAVORITES_KEY = "juice:favorites";
export const SEARCH_DEBOUNCE_MS = 300;
export const MAX_NEW_RECIPES = 6;
export const MAX_FAVORITES = 6;
