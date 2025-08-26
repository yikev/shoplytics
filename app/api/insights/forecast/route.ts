export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { expSmooth } from "@/lib/analytics";

const prisma = new PrismaClient();

export async function GET() {
  const tenantId = "tenant_demo";
  try {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const rows = await prisma.$queryRawUnsafe<{ d: Date; revenue: number }[]>(
      `
      SELECT date_trunc('day', "createdAt") AS d,
             SUM(total)::float AS revenue
      FROM "Order"
      WHERE "tenantId" = $1 AND "createdAt" >= $2
      GROUP BY 1
      ORDER BY 1
      `,
      tenantId,
      since
    );

    const history = rows.map((r) => ({
      date: r.d.toISOString().slice(0, 10),
      revenue: Number(r.revenue || 0),
    }));

    const series = history.map((h) => h.revenue);
    const forecast = expSmooth(series, 0.4, 30);

    // crude confidence band using stddev of last 30 days
    const recent = series.slice(-30);
    const mean =
      recent.reduce((s, x) => s + x, 0) / Math.max(1, recent.length);
    const sd = Math.sqrt(
      recent.reduce((s, x) => s + Math.pow(x - mean, 2), 0) /
        Math.max(1, recent.length - 1)
    );
    const band = forecast.map((y) => ({
      low: Math.max(0, y - sd),
      high: y + sd,
    }));

    return NextResponse.json({ last90: history, forecast, band });
  } catch (e) {
    console.error("[/api/insights/forecast] error:", e);
    return NextResponse.json({ error: "forecast_failed" }, { status: 500 });
  }
}