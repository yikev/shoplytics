import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { expSmooth } from "@/lib/analytics";

const prisma = new PrismaClient();

export async function GET() {
  const tenantId = "tenant_demo";
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

  const series = rows.map(r => Number(r.revenue ?? 0));
  const forecast = expSmooth(series, 0.4, 30);

  return NextResponse.json({
    last90: rows.map(r => ({ date: r.d.toISOString().slice(0, 10), revenue: Number(r.revenue || 0) })),
    forecast
  });
}