import { Prisma, PrismaClient, TagType } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ✅ 改成 PostgreSQL 的查詢方式
async function tableExists(table: string): Promise<boolean> {
  try {
    // 在 Postgres 用 information_schema 查是否存在
    const result = await prisma.$queryRaw<{ exists: boolean }[]>(
      Prisma.sql`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = ${table}
        ) AS "exists"
      `
    );
    return result?.[0]?.exists === true;
  } catch (error) {
    console.warn(`[seed] failed to check table "${table}"`, error);
    return false;
  }
}

async function seedTags() {
  if (!(await tableExists('Tag'))) {
    console.warn('[seed] Tag table not found, skip tag seeding');
    return;
  }

  const tagsPath = path.join(PROJECT_ROOT, 'data', 'tags.json');
  const exists = await fs
    .access(tagsPath)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    console.warn('[seed] tags.json not found, skip Tag seeding');
    return;
  }

  const raw = await fs.readFile(tagsPath, 'utf8');
  const data = JSON.parse(raw) as {
    functional?: string[];
    flavor?: string[];
  };

  const functional = data.functional ?? [];
  const flavor = data.flavor ?? [];

  for (const name of functional) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    await prisma.tag.upsert({
      where: {
        name_type: {
          name: trimmed,
          type: TagType.functional,
        },
      },
      update: {},
      create: {
        name: trimmed,
        type: TagType.functional,
      },
    });
  }

  for (const name of flavor) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    await prisma.tag.upsert({
      where: {
        name_type: {
          name: trimmed,
          type: TagType.flavor,
        },
      },
      update: {},
      create: {
        name: trimmed,
        type: TagType.flavor,
      },
    });
  }
}

async function seedRdi() {
  if (!(await tableExists('RdiStandard'))) {
    console.warn('[seed] RdiStandard table not found, skip RDI seeding');
    return;
  }

  const rdiPath = path.join(PROJECT_ROOT, 'data', 'rdi.csv');
  const exists = await fs
    .access(rdiPath)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    console.warn('[seed] rdi.csv not found, skip RDI seeding');
    return;
  }

  const raw = await fs.readFile(rdiPath, 'utf8');
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{
    nutrient: string;
    unit: string;
    adult_male: string;
    adult_female: string;
    source?: string;
  }>;

  const payload = records
    .map((record) => {
      const nutrient = record.nutrient.trim();
      if (!nutrient) return null;

      const maleValue = Number(record.adult_male);
      const femaleValue = Number(record.adult_female);

      return {
        nutrient,
        unit: record.unit.trim(),
        male_value: Number.isNaN(maleValue) ? null : maleValue,
        female_value: Number.isNaN(femaleValue) ? null : femaleValue,
        source: record.source?.trim() ?? 'CSV seed',
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (payload.length === 0) {
    console.warn('[seed] rdi.csv has no usable rows, skip seeding');
    return;
  }

  await prisma.rdiStandard.deleteMany();
  await prisma.rdiStandard.createMany({ data: payload });
}

async function main() {
  const args = process.argv.slice(2);
  const onlyRdi = args.includes('--rdi');

  if (onlyRdi) {
    await seedRdi();
    return;
  }

  await seedTags();
  await seedRdi();
}

main()
  .then(() => {
    console.log('Seed completed');
  })
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
