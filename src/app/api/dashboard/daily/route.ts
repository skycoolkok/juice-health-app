// src/app/api/dashboard/daily/route.ts
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

function parseDate(url: string) {
  const u = new URL(url);
  const dateParam = u.searchParams.get('date');
  return dateParam ? new Date(dateParam) : new Date();
}

export async function GET(req: Request) {
  try {
    const date = parseDate(req.url);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const { userId } = await resolveUserContext();

    const logs = await prisma.intakeLog.findMany({
      where: {
        logged_at: { gte: start, lt: end },
        ...(userId ? { user_id: userId } : {}),
      },
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
      return NextResponse.json({ summary: {}, logs: [], message: 'no logs found' });
    }

    const totalItems = typed.flatMap((l) => l.items).length;

    return NextResponse.json({
      summary: { totalItems },
      logs: typed,
    });
  } catch (err) {
    console.error('[api/dashboard/daily] failed:', err);
    // 回 200，前端不會炸掉
    return NextResponse.json({ summary: {}, logs: [], error: 'failed' }, { status: 200 });
  }
}
