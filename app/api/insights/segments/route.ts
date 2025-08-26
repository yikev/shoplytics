// app/api/insights/segments/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type CustAgg = { id: string; total: number; orders: number; recency: number };
type Buckets = { low: number; mid: number; high: number };

function quantile(arr: number[], p: number) {
  if (!arr.length) return 0;
  const i = Math.max(0, Math.min(arr.length - 1, Math.floor((arr.length - 1) * p)));
  return [...arr].sort((a, b) => a - b)[i];
}

function bucketizeCustomers(rows: CustAgg[]) {
  if (!rows.length) return { buckets: { low: 0, mid: 0, high: 0 } as Buckets };

  const recArr = rows.map((r) => r.recency);
  const totArr = rows.map((r) => r.total);
  const ordArr = rows.map((r) => r.orders);

  const cut = (v: number, arr: number[]) => {
    const q33 = quantile(arr, 0.33);
    const q66 = quantile(arr, 0.66);
    return v <= q33 ? 0 : v <= q66 ? 1 : 2;
    // 0 old/low, 2 recent/high
  };

  const buckets: Buckets = { low: 0, mid: 0, high: 0 };
  for (const r of rows) {
    const seg_rec = cut(r.recency, recArr);
    const seg_tot = cut(r.total, totArr);
    const seg_ord = cut(r.orders, ordArr);
    const score = seg_tot + seg_ord - seg_rec;
    if (score <= 0) buckets.low++;
    else if (score === 1) buckets.mid++;
    else buckets.high++;
  }

  return { buckets };
}

export async function GET() {
  try {
    const tenantId = "tenant_demo";
    const now = new Date();

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, totalSpent: true, ordersCount: true, createdAt: true },
    });

    const rows: CustAgg[] = customers.map((c) => ({
      id: c.id,
      total: Number(c.totalSpent ?? 0),
      orders: c.ordersCount ?? 0,
      recency: Math.max(
        1,
        Math.floor((now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      ),
    }));

    const { buckets } = bucketizeCustomers(rows);
    return NextResponse.json({ buckets });
  } catch (e) {
    console.error("[/api/insights/segments] error:", e);
    return NextResponse.json({ error: "segments_failed" }, { status: 500 });
  }
}