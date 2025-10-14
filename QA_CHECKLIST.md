# QA Checklist

## Locale Routing
- [ ] Default locale is zh-Hant; first visit redirects to `/zh-Hant`.
- [ ] Language switcher toggles to `/en` and back, and persists across reloads via the locale cookie.
- [ ] Routes and deep links continue to work with the locale prefix in place.

## Phase 4 Quick QA
1. **Locale parity**
   - [ ] With the dev server running, open `/zh-Hant` and `/en` for each primary route (`/`, `/recipes`, `/my-kitchen`, `/rdi-tracker`). Use the language switcher to confirm the same logical page opens with the alternate locale (URL should change only in the locale segment; query params stay intact).
2. **Translation audit**
   - [ ] Scan Home, Recipes, My Kitchen, and RDI Tracker screens in both locales. Verify every heading, button, helper text, empty state, and CTA originates from `messages/*.json` (no fallback English or hard-coded Chinese strings). Flag and fix any literal strings you encounter.
3. **Recipe detail sanity**
   - [ ] Navigate to `/[locale]/recipes/[id]` for at least one recipe that includes ingredients, steps/notes, and nutrition totals. Confirm the page renders:
     - Localised title/description/category
     - Ingredient list with units and multiplier control
     - Steps (or the translated empty placeholder when absent)
     - Nutrition grid with totals, per-serving values, and %RDI/NA badges
4. **Empty & NA states**
   - [ ] Recipes index: apply filters yielding no results. Ensure the translated empty-state copy appears.
   - [ ] My Kitchen: load with zero selected ingredients to show the empty basket message; verify missing-one cards list ingredients with translated labels.
   - [ ] Recipe detail: confirm nutrients without data show the translated `NA` text (`Data missing (NA)` / `缺少資料 (NA)`).
5. **Mobile viewport**
   - [ ] In browser devtools, set the viewport width to 375px (e.g., iPhone 12). Inspect each core page (Home, Recipes, My Kitchen, RDI Tracker, Recipe detail) for layout overflow: cards should wrap, filters remain scrollable, and text must not clip.
6. **Regression smoke**
   - [ ] Trigger favorite toggles and “Add to today” actions (where available). Watch the toast/status strings for proper localisation and that no console errors appear.

Record outcomes for every checkbox before sign-off. Update or extend automated tests when you find gaps.
