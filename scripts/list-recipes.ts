import { prisma } from '@/lib/prisma';

async function main() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { id: 'asc' },
    include: {
      ingredients: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  for (const recipe of recipes) {
    console.log(`[${recipe.id}] ${recipe.name}`);
    for (const item of recipe.ingredients) {
      console.log(`  - ${item.ingredient?.name} (${item.quantity ?? ''} ${item.unit ?? ''})`);
    }
    console.log('---');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
