// prisma/seed_recipes.ts
import { PrismaClient, TagType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 建立 Tags
  const functionalTags = ['活力補給', '排毒代謝', '輕卡無負擔'];
  const flavorTags = ['酸', '甜', '草本'];

  for (const name of functionalTags) {
    await prisma.tag.upsert({
      where: {
        name_type: {
          name,
          type: TagType.functional,
        },
      },
      update: {},
      create: {
        name,
        type: TagType.functional,
      },
    });
  }

  for (const name of flavorTags) {
    await prisma.tag.upsert({
      where: {
        name_type: {
          name,
          type: TagType.flavor,
        },
      },
      update: {},
      create: {
        name,
        type: TagType.flavor,
      },
    });
  }

  // 建立簡單食譜
  const recipes = [
    {
      slug: 'carrot-orange-ginger',
      name: '胡蘿蔔柳橙薑汁',
      category: '排毒代謝',
      servings: 1,
      locale: 'zh-Hant',
      description: '促進代謝、增強免疫力的早晨飲品',
      nutrition: {
        create: {
          calories: 120,
          protein: 2.5,
          carbs: 28,
          fat: 0.3,
          vitaminA: 450,
          vitaminC: 80,
          potassium: 300,
        },
      },
    },
    {
      slug: 'apple-celery-refresher',
      name: '蘋果芹菜清新汁',
      category: '輕卡無負擔',
      servings: 1,
      locale: 'zh-Hant',
      description: '清爽解膩的低熱量果蔬汁',
      nutrition: {
        create: {
          calories: 90,
          carbs: 22,
          fiber: 3,
          vitaminC: 60,
        },
      },
    },
  ];

  for (const data of recipes) {
    await prisma.recipe.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
  }

  console.log('✅ Recipe demo seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
