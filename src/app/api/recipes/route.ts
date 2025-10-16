// src/app/api/recipes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import meta from "@/data/tags.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        servings: true,
        imageUrl: true,   // 👈 加這個
        slug: true,       // 👈 以及這個（卡片常會拿來做連結）
        ingredients: {
          select: {
            ingredient: { select: { id: true } }, // 只拿 id 就夠
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const items = recipes.map((r) => {
      const tagsOfThis: { functional: string[]; flavor: string[] } =
        (meta as Record<number, { functional: string[]; flavor: string[] }>)[
          r.id
        ] ?? { functional: [], flavor: [] };

      const ingredientIds =
        r.ingredients?.map((ri) => ri.ingredient?.id).filter((id): id is number => typeof id === "number") ?? [];

      return {
        id: r.id,
        name: r.name ?? "",
        category: r.category ?? "",
        servings: r.servings ?? 0,
        slug: r.slug ?? null, // 前端如果要做 /recipes/[slug] 可用
        imageUrl: r.imageUrl ?? null, // 👈 前端拿這個畫圖，null 就顯示預設圖
        ingredientIds,
        functionalTags: tagsOfThis.functional,
        flavorTags: tagsOfThis.flavor,
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[/api/recipes] failed:", err);
    return NextResponse.json({ error: "Failed to load recipes" }, { status: 500 });
  }
}
