import { prisma } from "@/lib/prisma";
import { getRecipeMeta, type RecipeMeta } from "@/lib/recipeMeta";
import { resolveUserContext } from "@/lib/rdi";

import type { RecipeSummary } from "@/components/RecipeCard";
import { HomeClient } from "./_components/HomeClient";
import { MAX_FAVORITES, MAX_NEW_RECIPES } from "../home-constants";

type MetaMap = Record<number, RecipeMeta>;

async function getNewRecipes(meta: MetaMap): Promise<RecipeSummary[]> {
  try {
    const recipes = await prisma.recipe.findMany({
      orderBy: { id: "desc" },
      take: MAX_NEW_RECIPES,
      include: {
        ingredients: {
          include: {
            ingredient: {
              select: { id: true },
            },
          },
        },
      },
    });

    return recipes.map((recipe) => {
      const tags = meta[recipe.id] ?? { functional: [], flavor: [] };
      return {
        id: recipe.id,
        name: recipe.name,
        category: recipe.category,
        servings: typeof recipe.servings === "number" ? recipe.servings : null,
        ingredientIds: recipe.ingredients
          .map((item) => item.ingredient?.id)
          .filter((id): id is number => typeof id === "number"),
        functionalTags: tags.functional,
        flavorTags: tags.flavor,
      } satisfies RecipeSummary;
    });
  } catch (error) {
    console.error("[home] failed to load new recipes", error);
    return [];
  }
}
async function getFavoriteRecipes(meta: MetaMap): Promise<RecipeSummary[]> {
  try {
    const context = await resolveUserContext();
    if (!context.userId) {
      return [];
    }

    const favorites = await prisma.favorite.findMany({
      where: { user_id: context.userId },
      orderBy: { created_at: "desc" },
      take: MAX_FAVORITES,
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                ingredient: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    return favorites
      .map((favorite) => {
        const recipe = favorite.recipe;
        if (!recipe) return null;

        const tags = meta[recipe.id] ?? { functional: [], flavor: [] };

        const summary: RecipeSummary = {
          id: recipe.id,
          name: recipe.name,
          category: recipe.category,
          servings: recipe.servings ?? null,
          ingredientIds: recipe.ingredients
            .map((i) => i.ingredient?.id ?? i.ingredient_id)
            .filter((id): id is number => typeof id === "number"),
          functionalTags: tags.functional,
          flavorTags: tags.flavor,
        };
        return summary;
      })
      .filter((x): x is RecipeSummary => x !== null);
  } catch (error) {
    console.error("[home] failed to load favorite recipes", error);
    return [];
  }
} 

export default async function HomePage() {
  const meta = await getRecipeMeta();
  const [newRecipes, favoriteRecipes] = await Promise.all([
    getNewRecipes(meta),
    getFavoriteRecipes(meta),
  ]);

  return (
    <HomeClient
      initialNewRecipes={newRecipes}
      initialFavoriteRecipes={favoriteRecipes}
    />
  );
}
