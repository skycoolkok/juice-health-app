const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 每 100g / 100ml 的簡化營養表（開發用近似值）
const NF = {
  "胡蘿蔔":      { base: { val: 100, unit: 'g' }, calories_kcal: 41, protein_g: 0.9, carbs_g: 10, fat_g: 0.2, fiber_g: 2.8, vitamin_c_mg: 6,   potassium_mg: 320, sodium_mg: 69 },
  "柳橙":        { base: { val: 100, unit: 'g' }, calories_kcal: 47, protein_g: 0.9, carbs_g: 12, fat_g: 0.1, fiber_g: 2.4, vitamin_c_mg: 53,  potassium_mg: 181, sodium_mg: 0 },
  "鳳梨":        { base: { val: 100, unit: 'g' }, calories_kcal: 50, protein_g: 0.5, carbs_g: 13, fat_g: 0.1, fiber_g: 1.4, vitamin_c_mg: 48,  potassium_mg: 109, sodium_mg: 1 },
  "蘋果":        { base: { val: 100, unit: 'g' }, calories_kcal: 52, protein_g: 0.3, carbs_g: 14, fat_g: 0.2, fiber_g: 2.4, vitamin_c_mg: 4.6, potassium_mg: 107, sodium_mg: 1 },
  "菠菜":        { base: { val: 100, unit: 'g' }, calories_kcal: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, fiber_g: 2.2, vitamin_c_mg: 28,  potassium_mg: 558, sodium_mg: 79 },
  "香蕉":        { base: { val: 100, unit: 'g' }, calories_kcal: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, fiber_g: 2.6, vitamin_c_mg: 8.7, potassium_mg: 358, sodium_mg: 1 },
  "芹菜":        { base: { val: 100, unit: 'g' }, calories_kcal: 16, protein_g: 0.7, carbs_g: 3,  fat_g: 0.2, fiber_g: 1.6, vitamin_c_mg: 3.1, potassium_mg: 260, sodium_mg: 80 },
  "檸檬汁":      { base: { val: 100, unit: 'ml' }, calories_kcal: 22, protein_g: 0.4, carbs_g: 6.9, fat_g: 0.2, fiber_g: 0.3, vitamin_c_mg: 39, potassium_mg: 103, sodium_mg: 1 },
  "西瓜":        { base: { val: 100, unit: 'g' }, calories_kcal: 30, protein_g: 0.6, carbs_g: 8,  fat_g: 0.2, fiber_g: 0.4, vitamin_c_mg: 8.1, potassium_mg: 112, sodium_mg: 1 },
  "薄荷葉":      { base: { val: 100, unit: 'g' }, calories_kcal: 44, protein_g: 3.8, carbs_g: 8,  fat_g: 0.7, fiber_g: 2.0, vitamin_c_mg: 13,  potassium_mg: 569, sodium_mg: 31 },
  "葡萄":        { base: { val: 100, unit: 'g' }, calories_kcal: 69, protein_g: 0.7, carbs_g: 18, fat_g: 0.2, fiber_g: 0.9, vitamin_c_mg: 10.8, potassium_mg: 191, sodium_mg: 2 },
  "豆奶（無糖）": { base: { val: 100, unit: 'ml' }, calories_kcal: 33, protein_g: 3.3, carbs_g: 0.7, fat_g: 1.8, fiber_g: 0.4, vitamin_c_mg: 0,   potassium_mg: 118, sodium_mg: 47 },
  "番茄":        { base: { val: 100, unit: 'g' }, calories_kcal: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2, fiber_g: 1.2, vitamin_c_mg: 13.7, potassium_mg: 237, sodium_mg: 5 },
  "羅勒":        { base: { val: 100, unit: 'g' }, calories_kcal: 23, protein_g: 3.2, carbs_g: 2.7, fat_g: 0.6, fiber_g: 1.6, vitamin_c_mg: 18,  potassium_mg: 295, sodium_mg: 4 },
  "芒果":        { base: { val: 100, unit: 'g' }, calories_kcal: 60, protein_g: 0.8, carbs_g: 15, fat_g: 0.4, fiber_g: 1.6, vitamin_c_mg: 36,  potassium_mg: 168, sodium_mg: 1 },
  "優格（原味無糖）": { base: { val: 100, unit: 'g' }, calories_kcal: 59, protein_g: 3.5, carbs_g: 4.7, fat_g: 3.3, fiber_g: 0,   vitamin_c_mg: 1.5, potassium_mg: 155, sodium_mg: 46 },
  "奇異果":      { base: { val: 100, unit: 'g' }, calories_kcal: 61, protein_g: 1.1, carbs_g: 15, fat_g: 0.5, fiber_g: 3.0, vitamin_c_mg: 92.7, potassium_mg: 312, sodium_mg: 3 },
  "小黃瓜":      { base: { val: 100, unit: 'g' }, calories_kcal: 16, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1, fiber_g: 0.5, vitamin_c_mg: 2.8, potassium_mg: 147, sodium_mg: 2 },
  "苦瓜":        { base: { val: 100, unit: 'g' }, calories_kcal: 17, protein_g: 1.0, carbs_g: 3.7, fat_g: 0.2, fiber_g: 2.8, vitamin_c_mg: 84,  potassium_mg: 296, sodium_mg: 6 },
  "木瓜":        { base: { val: 100, unit: 'g' }, calories_kcal: 43, protein_g: 0.5, carbs_g: 11, fat_g: 0.3, fiber_g: 1.7, vitamin_c_mg: 60,  potassium_mg: 182, sodium_mg: 8 },
  "牛奶":        { base: { val: 100, unit: 'ml' }, calories_kcal: 42, protein_g: 3.4, carbs_g: 5,  fat_g: 1.0, fiber_g: 0,   vitamin_c_mg: 0,   potassium_mg: 150, sodium_mg: 44 },
  "蜂蜜":        { base: { val: 100, unit: 'g' }, calories_kcal: 304, protein_g: 0.3, carbs_g: 82, fat_g: 0,   fiber_g: 0,   vitamin_c_mg: 0.5, potassium_mg: 52, sodium_mg: 4 },
  "水":          { base: { val: 100, unit: 'ml' }, calories_kcal: 0,  protein_g: 0,  carbs_g: 0,  fat_g: 0,   fiber_g: 0,   vitamin_c_mg: 0,   potassium_mg: 0,  sodium_mg: 0 }
};

async function main() {
  const jsonPath = path.resolve(process.cwd(), 'data', 'seed-recipes.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`找不到 ${jsonPath}，請先建立 data/seed-recipes.json`);
  }

  const recipes = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  for (const r of recipes) {
    const ingredientIdsByName = {};

    for (const item of r.ingredients) {
      const name = item.name.trim();
      let ingredient = await prisma.ingredient.findFirst({ where: { name } });

      if (!ingredient) {
        ingredient = await prisma.ingredient.create({
          data: {
            name,
            category: 'general'
          }
        });
      }

      ingredientIdsByName[name] = ingredient.id;

      const existingNutrition = await prisma.nutritionFact.findFirst({
        where: { ingredient_id: ingredient.id }
      });

      const lookup = NF[name];
      if (!existingNutrition && lookup) {
        await prisma.nutritionFact.create({
          data: {
            ingredient_id: ingredient.id,
            per_amount_value: lookup.base.val,
            per_amount_unit: lookup.base.unit,
            calories_kcal: lookup.calories_kcal,
            protein_g: lookup.protein_g,
            carbs_g: lookup.carbs_g,
            fat_g: lookup.fat_g,
            fiber_g: lookup.fiber_g,
            vitamin_c_mg: lookup.vitamin_c_mg,
            potassium_mg: lookup.potassium_mg,
            sodium_mg: lookup.sodium_mg,
            source: 'seed-dev'
          }
        });
      }
    }

    const stepsText = Array.isArray(r.steps) && r.steps.length
      ? '步驟：' + r.steps.map((s, idx) => `${idx + 1}. ${s}`).join(' ')
      : null;
    const baseNotes = r.notes ? r.notes.trim() : '';
    const finalNotes = [baseNotes, stepsText].filter(Boolean).join('\n');

    let recipe = await prisma.recipe.findFirst({ where: { name: r.name } });

    if (!recipe) {
      recipe = await prisma.recipe.create({
        data: {
          name: r.name,
          servings: r.servings ?? 1,
          category: 'JUICE',
          notes: finalNotes || null,
          source: 'seed-dev'
        }
      });
    } else {
      await prisma.recipeIngredient.deleteMany({ where: { recipe_id: recipe.id } });
      recipe = await prisma.recipe.update({
        where: { id: recipe.id },
        data: {
          servings: r.servings ?? 1,
          notes: finalNotes || null
        }
      });
    }

    for (const item of r.ingredients) {
      const ingredientId = ingredientIdsByName[item.name.trim()];

      await prisma.recipeIngredient.create({
        data: {
          recipe_id: recipe.id,
          ingredient_id: ingredientId,
          quantity: item.quantity,
          unit: item.unit
        }
      });
    }

    console.log(`✔ 已匯入：${r.name}`);
  }

  console.log('✅ 完成食譜匯入！');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });