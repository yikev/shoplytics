// app/api/customers/list/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type CustAgg = { id: string; total: number; orders: number; recency: number };

function quantile(arr: number[], p: number) {
  if (!arr.length) return 0;
  const i = Math.max(0, Math.min(arr.length - 1, Math.floor((arr.length - 1) * p)));
  return [...arr].sort((a, b) => a - b)[i];
}

function labelCustomers(rows: CustAgg[]) {
  type Labeled = CustAgg & { seg_rec: number; seg_tot: number; seg_ord: number };
  if (!rows.length) return { labeled: [] as Labeled[] };

  const recArr = rows.map((r) => r.recency);
  const totArr = rows.map((r) => r.total);
  const ordArr = rows.map((r) => r.orders);

  const cut = (v: number, arr: number[]) => {
    const q33 = quantile(arr, 0.33);
    const q66 = quantile(arr, 0.66);
    return v <= q33 ? 0 : v <= q66 ? 1 : 2;
  };

  const labeled: Labeled[] = rows.map((r) => ({
    ...r,
    seg_rec: cut(r.recency, recArr),
    seg_tot: cut(r.total, totArr),
    seg_ord: cut(r.orders, ordArr),
  }));

  return { labeled };
}

type SortKey = "totalSpent" | "ordersCount" | "createdAt";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "20")));
  const sort = (url.searchParams.get("sort") as SortKey) || "totalSpent";
  const dir = (url.searchParams.get("dir") === "asc" ? "asc" : "desc") as "asc" | "desc";
  const q = (url.searchParams.get("q") || "").trim();
  const segment = url.searchParams.get("segment") as "high" | "mid" | "low" | null;

  const tenantId = "tenant_demo";

  try {
    const where: Prisma.CustomerWhereInput = { tenantId };
    if (q) where.email = { contains: q, mode: "insensitive" };

    // Segment filtering
    if (segment) {
      const basics = await prisma.customer.findMany({
        where: { tenantId },
        select: { id: true, totalSpent: true, ordersCount: true, createdAt: true },
      });

      const now = Date.now();
      const rows: CustAgg[] = basics.map((c) => ({
        id: c.id,
        total: Number(c.totalSpent ?? 0),
        orders: c.ordersCount ?? 0,
        recency: Math.max(1, Math.floor((now - c.createdAt.getTime()) / (1000 * 60 * 60 * 24))),
      }));

      const { labeled } = labelCustomers(rows);
      const ids = labeled
        .filter((r) => {
          const score = r.seg_tot + r.seg_ord - r.seg_rec;
          if (segment === "high") return score >= 2;
          if (segment === "mid") return score === 1;
          return score <= 0; // low
        })
        .map((r) => r.id);

      where.id = ids.length ? { in: ids } : { in: ["__no_match__"] };
    }

    const [total, rawItems] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { [sort]: dir },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          ordersCount: true,
          totalSpent: true, // Decimal
          createdAt: true,
        },
      }),
    ]);

    // Normalize Prisma Decimal -> number for the UI
    const items = rawItems.map((c) => ({
      id: c.id,
      email: c.email,
      ordersCount: c.ordersCount,
      totalSpent: Number(c.totalSpent ?? 0),
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ total, page, pageSize, items });
  } catch (e) {
    console.error("[/api/customers/list] error:", e);
    return NextResponse.json({ error: "customers_list_failed" }, { status: 500 });
  }
}