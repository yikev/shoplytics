export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const r = await prisma.$queryRaw`SELECT 1 as ok`;
    return NextResponse.json({ ok: true, r });
  } catch (e: unknown) {
    console.error("[db-ping] error", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}