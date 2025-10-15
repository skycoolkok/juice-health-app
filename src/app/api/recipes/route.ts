// src/app/api/recipes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import meta from "@/data/tags.json";

/**
 * 回傳前端需要的食譜清單。
 * - 取得每個食譜的食材 id（需要 include -> ingredients -> ingredient）
 * - 依 id 遞增排序（可依你的 schema 改掉欄位）
 * - 將 meta 的功能/風味標籤合併進結果
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true, // 這樣才能拿到 ingredient.id
          },
        },
      },
      orderBy: { id: "asc" }, // 確認你的 schema 有這欄位；需要別的欄位就改它
    });

    const items = recipes.map((recipe) => {
      // 如果沒有對應的 meta，就給預設空陣列
      const tags: { functional: string[]; flavor: string[] } =
        (meta as Record<number, { functional: string[]; flavor: string[] }>)[
          recipe.id as unknown as number
        ] ?? { functional: [], flavor: [] };

      const ingredientIds =
        recipe.ingredients
          ?.map((ri) => ri.ingredient?.id)
          // 型別守衛：只保留 number
          .filter((id): id is number => typeof id === "number") ?? [];

      return {
        id: recipe.id,
        name: recipe.name ?? "",
        category: recipe.category ?? "",
        servings: recipe.servings ?? 0,
        ingredientIds,
        functionalTags: tags.functional,
        flavorTags: tags.flavor,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[/api/recipes] failed::", err);
    return NextResponse.json(
      { error: "Failed to load recipes" },
      { status: 500 }
    );
  }
}
