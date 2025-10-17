// scripts/seed-recipes.js
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 你可以把資料替換成自己的來源（CSV/JSON）
 * 目前先放兩筆示例，確保流程可跑
 */
const RECIPES = [
  {
    slug: 'carrot-orange-ginger',
    name: '胡蘿蔔柳橙薑汁',
    category: '排毒代謝',
    servings: 1,
    ingredients: [
      { name: '胡蘿蔔', amount: 150 },
      { name: '柳橙', amount: 200 },
      { name: '薑', amount: 5 },
    ],
  },
  {
    slug: 'apple-celery-refresher',
    name: '蘋果芹菜清新汁',
    category: '輕卡無負擔',
    servings: 1,
    ingredients: [
      { name: '蘋果', amount: 180 },
      { name: '芹菜', amount: 120 },
      { name: '檸檬', amount: 10 },
    ],
  },
];

async function ensureIngredient(name, unit = null) {
  // 用 name 當唯一（schema 已設定 @unique）
  const ing = await prisma.ingredient.findUnique({ where: { name } });
  if (ing) return ing;

  return prisma.ingredient.create({
    data: { name, unit }, // 目前 schema 是 unit:String?（沒有 default_unit）
  });
}

async function ensureRecipeBySlug(payload) {
  // 用 slug 當唯一（schema 已設定 @unique）
  return prisma.recipe.upsert({
    where: { slug: payload.slug },
    update: {
      name: payload.name,
      category: payload.category ?? null,
      servings: payload.servings ?? 1,
      imageUrl: payload.imageUrl ?? null,
      description: payload.description ?? null,
      notes: payload.notes ?? null,
      source: payload.source ?? null,
      // 若你有 locale 欄位想更新，也可放這
    },
    create: {
      slug: payload.slug,
      name: payload.name,
      category: payload.category ?? null,
      servings: payload.servings ?? 1,
      imageUrl: payload.imageUrl ?? null,
      description: payload.description ?? null,
      notes: payload.notes ?? null,
      source: payload.source ?? null,
      locale: payload.locale ?? 'zh-Hant',
    },
    select: { id: true },
  });
}

async function ensureRecipeIngredient(recipeId, ingredientId, amount) {
  // RecipeIngredient 目前只有 id 自動遞增，沒有 unique key
  // 用 findFirst 判斷是否已存在這個組合，避免重複建立
  const exists = await prisma.recipeIngredient.findFirst({
    where: { recipeId, ingredientId },
    select: { id: true },
  });

  if (!exists) {
    await prisma.recipeIngredient.create({
      data: {
        recipeId,
        ingredientId,
        amount: amount ?? null, // schema 裡 RecipeIngredient 只有 amount: Float?
      },
    });
  }
}

async function main() {
  for (const r of RECIPES) {
    // 1) upsert recipe
    const recipe = await ensureRecipeBySlug(r);

    // 2) ensure 每個 ingredient 都存在
    for (const item of r.ingredients || []) {
      const ing = await ensureIngredient(item.name, null);

      // 3) 建立關聯
      await ensureRecipeIngredient(recipe.id, ing.id, item.amount);
    }
  }
  console.log('✅ Recipes seeding completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
