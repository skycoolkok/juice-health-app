// src/app/api/dashboard/weekly/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUserContext } from '@/lib/rdi';

// 輕量型別（只抓我們會用到的欄位，避免 unknown）
type IntakeItemLite = {
  ingredient?: { id: number; name: string | null; unit: string | null } | null;
  recipe?: { id: number; name: string | null; servings: number | null } | null;
};
type IntakeLogLite = {
  logged_at: Date;
  items: IntakeItemLite[];
};

function parseRange(url: string) {
  const u = new URL(url);
  const endParam = u.searchParams.get('end');
  const end = endParam ? new Date(endParam) : new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export async function GET(req: Request) {
  try {
    const { start, end } = parseRange(req.url);
    const { userId } = await resolveUserContext();

    const logs = await prisma.intakeLog.findMany({
      where: {
        logged_at: { gte: start, lt: end },
        ...(userId ? { user_id: userId } : {}),
      },
      orderBy: { logged_at: 'asc' },
      include: {
        items: {
          include: {
            ingredient: { select: { id: true, name: true, unit: true } },
            recipe: { select: { id: true, name: true, servings: true } },
          },
        },
      },
    });

    const typed: IntakeLogLite[] = (logs ?? []).map((l) => ({
      logged_at: l.logged_at,
      items: (l.items ?? []) as IntakeItemLite[],
    }));

    if (typed.length === 0) {
      return NextResponse.json({ summary: [], logs: [], message: 'no logs found' });
    }

    // 依日期分組（yyyy-mm-dd -> items[]）
    const grouped: Record<string, IntakeItemLite[]> = {};
    for (const log of typed) {
      const key = log.logged_at.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(...(log.items ?? []));
    }

    const summary = Object.entries(grouped).map(([date, items]) => ({
      date,
      count: items.length,
    }));

    return NextResponse.json({ summary, logs: typed });
  } catch (err) {
    console.error('[api/dashboard/weekly] failed:', err);
    // 回 200，前端不會炸掉
    return NextResponse.json({ summary: [], logs: [], error: 'failed' }, { status: 200 });
  }
}
