// app/api/kpis/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Range = "30d" | "90d";

function rangeToDays(r?: string): number {
  return r === "90d" ? 90 : 30;
}
const sum = (xs: number[]) => xs.reduce((s, n) => s + n, 0);
function pctDelta(curr: number, prev: number): number | null {
  if (!isFinite(prev) || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = (url.searchParams.get("range") as Range) || "30d";
  const days = rangeToDays(range);
  const tenantId = "tenant_demo";

  try {
    const now = Date.now();
    const sinceCurrent = new Date(now - days * 24 * 60 * 60 * 1000);
    const sincePrevious = new Date(now - 2 * days * 24 * 60 * 60 * 1000);

    const [ordersCurrent, ordersPrevious] = await Promise.all([
      prisma.order.findMany({
        where: { tenantId, createdAt: { gte: sinceCurrent } },
        select: { total: true },
      }),
      prisma.order.findMany({
        where: { tenantId, createdAt: { gte: sincePrevious, lt: sinceCurrent } },
        select: { total: true },
      }),
    ]);

    // Current period
    const totalsCur = ordersCurrent.map((o) => Number(o.total));
    const revenue = sum(totalsCur);
    const orders = ordersCurrent.length;
    const aov = orders ? revenue / orders : 0;

    // Previous period
    const totalsPrev = ordersPrevious.map((o) => Number(o.total));
    const revenuePrev = sum(totalsPrev);
    const ordersPrev = ordersPrevious.length;
    const aovPrev = ordersPrev ? revenuePrev / ordersPrev : 0;

    // Demo-only conversion 
    const sessions = days * 1000;
    const conversion = sessions ? (orders / sessions) * 100 : 0;
    const conversionPrev = sessions ? (ordersPrev / sessions) * 100 : 0;

    return NextResponse.json({
      range,
      revenue,
      orders,
      aov,
      conversion, // %
      deltaRevenuePct: pctDelta(revenue, revenuePrev),
      deltaOrdersPct: pctDelta(orders, ordersPrev),
      deltaAovPct: pctDelta(aov, aovPrev),
      deltaConversionPct: pctDelta(conversion, conversionPrev),
    });
  } catch (e) {
    console.error("[/api/kpis] error:", e);
    return NextResponse.json({ error: "kpis_failed" }, { status: 500 });
  }
}