import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import { ensureRecipeTotals } from '../src/lib/recipe-totals';

const prisma = new PrismaClient();
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(PROJECT_ROOT, 'data', 'seed-recipes.json');
const META_PATH = path.join(PROJECT_ROOT, 'data', 'recipe-meta.json');

type SeedIngredient = {
  name: string;
  quantity?: number | null;
  unit?: string | null;
};

type SeedRecipe = {
  name: string;
  category?: string | null;
  servings?: number | null;
  description?: string | null;
  notes?: string | null;
  source?: string | null;
  ingredients: SeedIngredient[];
  steps?: string[];
  tags?: {
    functional?: string[];
    flavor?: string[];
  };
};

function defaultUnitFromSeed(unit?: string | null): string | null {
  if (!unit) return null;
  const normalized = unit.toLowerCase();
  if (['ml', 'milliliter', 'cup'].includes(normalized)) return 'ml';
  return 'g';
}

async function upsertIngredient(seed: SeedIngredient) {
  const name = seed.name.trim();
  if (!name) throw new Error('Ingredient name is required');
  const defaultUnit = defaultUnitFromSeed(seed.unit);
  return prisma.ingredient.upsert({
    where: { name },
    update: {
      default_unit: defaultUnit ?? undefined,
    },
    create: {
      name,
      category: 'Produce',
      default_unit: defaultUnit,
    },
  });
}

function buildNotes(description?: string | null, steps?: string[]): string | null {
  if ((!description || description.trim().length === 0) && (!steps || steps.length === 0)) {
    return null;
  }
  const parts: string[] = [];
  if (description?.trim()) {
    parts.push(description.trim());
  }
  if (steps && steps.length > 0) {
    const formatted = steps
      .map((step, index) => `Step ${index + 1}. ${step}`)
      .join('\n');
    parts.push(formatted);
  }
  return parts.join('\n\n');
}

async function seedRecipe(
  seed: SeedRecipe,
  meta: Record<string, { functional: string[]; flavor: string[] }>,
  processedIds: Set<string>,
) {
  const notes = buildNotes(seed.description, seed.steps);
  const recipe = await prisma.recipe.upsert({
    where: { name: seed.name },
    update: {
      category: seed.category ?? null,
      servings: seed.servings ?? null,
      description: seed.description ?? null,
      notes,
      source: seed.source ?? 'seed',
    },
    create: {
      name: seed.name,
      category: seed.category ?? null,
      servings: seed.servings ?? null,
      description: seed.description ?? null,
      notes,
      source: seed.source ?? 'seed',
    },
  });

  await prisma.recipeIngredient.deleteMany({ where: { recipe_id: recipe.id } });

  for (const ingredientSeed of seed.ingredients) {
    const ingredient = await upsertIngredient(ingredientSeed);
    await prisma.recipeIngredient.create({
      data: {
        recipe_id: recipe.id,
        ingredient_id: ingredient.id,
        quantity: ingredientSeed.quantity ?? null,
        unit: ingredientSeed.unit ?? ingredient.default_unit ?? null,
      },
    });
  }

  await ensureRecipeTotals({ recipeId: recipe.id, force: true });

  const functional = (seed.tags?.functional ?? []).map((tag) => tag.toUpperCase());
  const flavor = (seed.tags?.flavor ?? []).map((tag) => tag.toUpperCase());
  const recipeId = String(recipe.id);
  meta[recipeId] = { functional, flavor };
  processedIds.add(recipeId);

  console.log(`Seeded recipe: ${recipe.name} (#${recipe.id})`);
}

async function main() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  const seeds = JSON.parse(raw) as SeedRecipe[];
  if (!Array.isArray(seeds) || seeds.length === 0) {
    console.error('[seed-recipes] No seed data found');
    return;
  }

  let existingMeta: Record<string, { functional: string[]; flavor: string[] }> = {};
  try {
    const metaRaw = await fs.readFile(META_PATH, 'utf8');
    existingMeta = JSON.parse(metaRaw);
  } catch (error) {
    console.warn('[seed-recipes] recipe-meta.json missing or invalid, creating new map');
    existingMeta = {};
  }

  const meta: Record<string, { functional: string[]; flavor: string[] }> = {};
  const processedRecipeIds = new Set<string>();
  for (const seed of seeds) {
    await seedRecipe(seed, meta, processedRecipeIds);
  }

  const staleRecipeIds = Object.keys(existingMeta).filter((id) => !processedRecipeIds.has(id));
  if (staleRecipeIds.length > 0) {
    console.log('[seed-recipes] Removing metadata for missing recipes:', staleRecipeIds.join(', '));
  }

  const sortedMetaEntries = Object.entries(meta)
    .sort((a, b) => Number(a[0]) - Number(b[0]));
  const sortedMeta = Object.fromEntries(sortedMetaEntries);
  await fs.writeFile(
    META_PATH,
    JSON.stringify(sortedMeta, null, 2) + '\n',
    { encoding: 'utf8' },
  );
  console.log('[seed-recipes] Completed');
}

main()
  .catch((error) => {
    console.error('[seed-recipes] Failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
