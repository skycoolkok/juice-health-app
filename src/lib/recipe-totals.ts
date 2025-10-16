import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import {
  NUTRIENT_KEYS,
  type NutrientTotals,
  addTotals,
  convertToBase,
  createEmptyTotals,
  createNaTotals,
  divideTotals,
  normalizeUnit,
} from './nutrients';

/**
 * 目前專案的 Prisma schema 裡，Ingredient 沒有 nutrition 關聯。
 * 因此這裡僅選基本欄位，不再 include nutrition。
 */
export type IngredientWithNutrition = Prisma.IngredientGetPayload<{
  select: {
    id: true;
    name: true;
    default_unit: true;
  };
}>;

export type RecipeWithNutrition = Prisma.RecipeGetPayload<{
  include: {
    ingredients: {
      include: {
        ingredient: {
          select: {
            id: true;
            name: true;
            default_unit: true;
          };
        };
      };
    };
  };
}>;

export type RecipeTotalsPayload = {
  totals: NutrientTotals;
  perServing: NutrientTotals | null;
  servings: number | null;
};

/**
 * 目前無 nutrition 資料來源，先回傳 NA 佔位。
 * 未來若補回營養表，可在這裡實作真正的換算。
 */
export function calculateIngredientTotals(options: {
  ingredient: IngredientWithNutrition | null;
  quantity: number | null | undefined;
  unit: string | null | undefined;
}): NutrientTotals {
  // 你也可以在這裡用 convertToBase/normalizeUnit 做重量換算，
  // 但因為缺 nutrition，最後仍回傳 NA。
  return createNaTotals();
}

export function calculateRecipeTotals(recipe: RecipeWithNutrition): RecipeTotalsPayload {
  let totals = createEmptyTotals();

  for (const item of recipe.ingredients) {
    const ingredientTotals = calculateIngredientTotals({
      ingredient: item.ingredient as IngredientWithNutrition,
      quantity: (item as any).quantity ?? null,
      unit:
        (item as any).unit ??
        (item.ingredient as IngredientWithNutrition | null)?.default_unit ??
        null,
    });
    totals = addTotals(totals, ingredientTotals);
  }

  const servings =
    typeof (recipe as any).servings === 'number' && Number.isFinite((recipe as any).servings)
      ? (recipe as any).servings
      : null;

  const perServing = servings && servings > 0 ? divideTotals(totals, servings) : null;

  return {
    totals,
    perServing,
    servings,
  };
}

function parseTotalsObject(value: unknown): NutrientTotals | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const source = value as Record<string, unknown>;
  const totals = createNaTotals();
  for (const key of NUTRIENT_KEYS) {
    const candidate = source[key];
    if (candidate === null || candidate === undefined) {
      totals[key] = null;
    } else if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      totals[key] = candidate;
    } else {
      return null;
    }
  }
  return totals;
}

export function parseRecipeTotalsPayload(value: Prisma.JsonValue | null): RecipeTotalsPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const totals = parseTotalsObject(record.totals);
  if (!totals) {
    return null;
  }
  const perServing = record.perServing ? parseTotalsObject(record.perServing) : null;
  const servingsRaw = record.servings;
  const servings =
    typeof servingsRaw === 'number' && Number.isFinite(servingsRaw) ? servingsRaw : null;
  return {
    totals,
    perServing,
    servings,
  };
}

export async function getCachedRecipeTotals(recipeId: number): Promise<RecipeTotalsPayload | null> {
  const record = await prisma.recipeTotals.findUnique({ where: { recipe_id: recipeId } });
  if (!record) {
    return null;
  }
  return parseRecipeTotalsPayload(record.totals);
}

export async function ensureRecipeTotals(options: {
  recipeId: number;
  recipe?: RecipeWithNutrition | null;
  force?: boolean;
}): Promise<RecipeTotalsPayload> {
  const { recipeId, recipe, force = false } = options;

  if (!force) {
    const existing = await prisma.recipeTotals.findUnique({ where: { recipe_id: recipeId } });
    if (existing) {
      const parsed = parseRecipeTotalsPayload(existing.totals);
      if (parsed) {
        return parsed;
      }
    }
  }

  const recipeRecord =
    recipe ??
    (await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                
              },
            },
          },
        },
      },
    }));

  if (!recipeRecord) {
    throw new Error(`Recipe ${recipeId} not found`);
  }

  const computed = calculateRecipeTotals(recipeRecord as RecipeWithNutrition);
  await prisma.recipeTotals.upsert({
    where: { recipe_id: recipeId },
    update: { totals: computed },
    create: {
      recipe_id: recipeId,
      totals: computed,
    },
  });
  return computed;
}

export async function invalidateRecipeTotals(recipeId: number): Promise<void> {
  try {
    await prisma.recipeTotals.delete({ where: { recipe_id: recipeId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return;
    }
    throw error;
  }
}
