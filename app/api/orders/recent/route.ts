export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 10), 50);
  const tenantId = "tenant_demo";

  try {
    const orders = await prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        status: true, 
        total: true,
        customer: { select: { email: true } },
      },
    });

    const items = orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt.toISOString(),
      status: o.status,     
      total: Number(o.total ?? 0),
      email: o.customer?.email ?? "—",
    }));

    return NextResponse.json({ items });
  } catch (e) {
    console.error("[/api/orders/recent] error:", e);
    return NextResponse.json({ error: "recent_orders_failed" }, { status: 500 });
  }
}