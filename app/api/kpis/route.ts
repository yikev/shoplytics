import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = url.searchParams.get("range") ?? "30d"; // "30d" | "90d"
  const days = range === "90d" ? 90 : 30;
  const since = daysAgo(days);

  // In a bit we’ll read tenant_id from session; demo for now:
  const tenantId = "tenant_demo";

  const orders = await prisma.order.findMany({
    where: { tenantId, createdAt: { gte: since } },
    select: { total: true },
  });

  // Convert Decimal -> number
  const totals = orders.map(o => Number(o.total));
  const revenue = totals.reduce((s, x) => s + x, 0);
  const ordersCount = orders.length;
  const AOV = ordersCount ? revenue / ordersCount : 0;

  // Approx “conversion” for demo: fake storefront traffic
  // (Replace with real sessions later if you track them)
  const visits = days * 1000; // pretend 1k visits/day
  const conversion = visits ? ordersCount / visits : 0;

  return NextResponse.json({
    range: days,
    revenue,
    orders: ordersCount,
    AOV,
    conversion, // 0–1
  });
}