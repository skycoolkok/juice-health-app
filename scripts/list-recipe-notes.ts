import { prisma } from '@/lib/prisma';

async function main() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { id: 'asc' },
  });

  for (const recipe of recipes) {
    console.log(`--- [${recipe.id}] ${recipe.name}`);
    console.log('Description:', recipe.description);
    console.log('Notes:', recipe.notes);
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
