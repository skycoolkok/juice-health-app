// src/app/api/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserContext } from '@/lib/rdi';

function parseRange(req: NextRequest) {
  const url = new URL(req.url);
  const startStr = url.searchParams.get('start');
  const endStr = url.searchParams.get('end');

  // 預設取最近 7 天
  const end = endStr ? new Date(endStr) : new Date();
  const start = startStr
    ? new Date(startStr)
    : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 保底
  if (Number.isNaN(start.getTime())) {
    start.setTime(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (Number.isNaN(end.getTime())) {
    end.setTime(Date.now());
  }
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const { start, end } = parseRange(req);
    const context = await resolveUserContext();

    // where 條件安全拼接（userId 可能為 null）
    const where: any = {
      logged_at: { gte: start, lt: end },
    };
    if (context.userId) where.user_id = context.userId;

    // 請注意：這裡只 select 存在於 schema 的欄位，避免 runtime 錯誤
    const logs = await prisma.intakeLog.findMany({
      where,
      orderBy: { logged_at: 'asc' },
      select: {
        id: true,
        logged_at: true,
        notes: true,
        items: {
          select: {
            id: true,
            amount_value: true,
            amount_unit: true,
            notes: true,
            // ingredient 只拿到真的存在的欄位
            ingredient: {
              select: { id: true, name: true, unit: true },
            },
            // recipe 只拿必要欄位（若前端會再打細節，再另外查）
            recipe: {
              select: { id: true, name: true, servings: true },
            },
            // 自訂營養（若有）
            custom_nutrition: true,
          },
        },
      },
    });

    return NextResponse.json({ items: logs });
  } catch (error) {
    console.error('[GET /api/logs] failed', error);
    // 即使失敗也傳空陣列，避免前端出錯
    return NextResponse.json({ items: [], error: 'failed' }, { status: 200 });
  }
}
