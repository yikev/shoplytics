export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") ?? 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const tenantId = "tenant_demo";

  // group by date (daily revenue)
  const rows = await prisma.$queryRawUnsafe<
    { d: Date; revenue: number }[]
  >(
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

  // Return a simple array like [{ date: '2025-07-01', revenue: 1234.56 }, ...]
  const data = rows.map((r) => ({
    date: r.d.toISOString().slice(0, 10),
    revenue: Number(r.revenue || 0),
  }));

  return NextResponse.json(data);
}