// app/api/products/top/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type TopProductRow = {
  id: string;
  title: string;
  sku: string | null;
  units: number;
  revenue: number;
  price: number;
  cost: number;
  inventory: number;
};

export async function GET() {
  const tenantId = "tenant_demo";
  const rows = await prisma.$queryRawUnsafe<TopProductRow[]>(
    `
    SELECT p.id, p.title, p.sku,
           SUM(oi.quantity)::int AS units,
           SUM(oi.quantity * oi."unitPrice")::float AS revenue,
           AVG(p.price)::float AS price,
           AVG(p.cost)::float AS cost,
           MAX(p.inventory)::int AS inventory
    FROM "OrderItem" oi
    JOIN "Product" p ON p.id = oi."productId"
    JOIN "Order" o ON o.id = oi."orderId"
    WHERE o."tenantId" = $1
    GROUP BY p.id, p.title, p.sku
    ORDER BY revenue DESC
    LIMIT 25
    `,
    tenantId
  );

  const result = rows.map((r) => ({
    ...r,
    marginPct: r.price ? ((r.price - r.cost) / r.price) * 100 : 0,
  }));

  return NextResponse.json(result);
}