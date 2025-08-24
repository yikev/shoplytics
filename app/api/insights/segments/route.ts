import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// tiny helpers kept here to avoid path/alias issues
function quantile(arr: number[], p: number) {
  if (!arr.length) return 0;
  const i = Math.max(0, Math.min(arr.length - 1, Math.floor((arr.length - 1) * p)));
  return [...arr].sort((a, b) => a - b)[i];
}
function bucketizeCustomers(rows: { recency: number; total: number; orders: number }[]) {
  if (!rows.length) return { buckets: { low: 0, mid: 0, high: 0 }, labeled: [] as any[] };

  const recArr = rows.map(r => r.recency);
  const totArr = rows.map(r => r.total);
  const ordArr = rows.map(r => r.orders);
  const cut = (v: number, arr: number[]) => {
    const q33 = quantile(arr, 0.33);
    const q66 = quantile(arr, 0.66);
    return v <= q33 ? 0 : v <= q66 ? 1 : 2; // 0=low,1=mid,2=high
  };

  const labeled = rows.map(r => ({
    ...r,
    seg_rec: cut(r.recency, recArr),
    seg_tot: cut(r.total, totArr),
    seg_ord: cut(r.orders, ordArr),
  }));

  const buckets = { low: 0, mid: 0, high: 0 };
  for (const r of labeled) {
    // higher total+orders and LOWER recency (more recent) → higher score
    const score = r.seg_tot + r.seg_ord - r.seg_rec;
    if (score <= 0) buckets.low++;
    else if (score === 1) buckets.mid++;
    else buckets.high++;
  }
  return { buckets, labeled };
}

export async function GET() {
  const tenantId = "tenant_demo";
  try {
    const now = new Date();

    // pull minimal fields; convert Decimals to numbers safely
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, totalSpent: true, ordersCount: true, createdAt: true },
    });

    if (!customers.length) {
      return NextResponse.json({ buckets: { low: 0, mid: 0, high: 0 }, customers: [] });
    }

    const rows = customers.map(c => ({
      id: c.id,
      total: Number(c.totalSpent ?? 0),
      orders: c.ordersCount ?? 0,
      // simple recency proxy; for more accuracy use last order date
      recency: Math.max(1, Math.floor((now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24))),
    }));

    const { buckets, labeled } = bucketizeCustomers(rows);
    return NextResponse.json({ buckets, customers: labeled });
  } catch (e) {
    console.error("[/api/insights/segments] error:", e);
    return NextResponse.json({ error: "segments_failed" }, { status: 500 });
  }
}