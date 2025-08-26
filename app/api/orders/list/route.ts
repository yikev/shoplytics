// app/api/orders/list/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Dir = "asc" | "desc";
type SortKey = "createdAt" | "total" | "status";
type Status = "PENDING" | "PAID" | "CANCELLED";

function toInt(v: string | null, def: number) {
  const n = Number(v ?? def);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function parseDate(v: string | null): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const page = toInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(toInt(url.searchParams.get("pageSize"), 20), 100);

  const sort = (url.searchParams.get("sort") as SortKey) || "createdAt";
  const dir: Dir = url.searchParams.get("dir") === "asc" ? "asc" : "desc";
  const q = (url.searchParams.get("q") || "").trim();

  // NEW: optional filters
  const statusParam = url.searchParams.get("status") as Status | null;
  const status: Status | undefined =
    statusParam && ["PENDING", "PAID", "CANCELLED"].includes(statusParam)
      ? (statusParam as Status)
      : undefined;

  const from = parseDate(url.searchParams.get("from")); // ISO like 2024-01-01
  const to = parseDate(url.searchParams.get("to"));     // exclusive upper bound

  const tenantId = "tenant_demo";

  try {
    const where: any = { tenantId };

    if (q) {
      // search by order id or customer email
      where.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { customer: { is: { email: { contains: q, mode: "insensitive" } } } },
      ];
    }

    if (status) where.status = status;

    if (from || to) {
      where.createdAt = {
        ...(from && { gte: from }),
        ...(to && { lt: to }),
      };
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { [sort]: dir }, // supports enum ordering too
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          total: true,          // Decimal
          status: true,         // <-- include status
          createdAt: true,
          customer: { select: { email: true } },
        },
      }),
    ]);

    const items = orders.map((o) => ({
      id: o.id,
      total: Number(o.total ?? 0),
      status: o.status as Status,
      createdAt: o.createdAt.toISOString(),
      customerEmail: o.customer?.email ?? "—",
    }));

    return NextResponse.json({ total, page, pageSize, items });
  } catch (e) {
    console.error("[/api/orders/list] error:", e);
    return NextResponse.json({ error: "orders_list_failed" }, { status: 500 });
  }
}