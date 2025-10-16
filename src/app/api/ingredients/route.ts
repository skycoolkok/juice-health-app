// src/app/api/ingredients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
      // 只挑模型中存在的欄位：id、name、unit
      select: { id: true, name: true, unit: true },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/ingredients] GET failed:", error);
    return NextResponse.json({ error: "failed to load ingredients" }, { status: 500 });
  }
}
