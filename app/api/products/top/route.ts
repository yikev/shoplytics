// app/api/products/top/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Range = "30d" | "90d";
type Dir = "asc" | "desc";
type SortKey = "revenue" | "units" | "margin" | "inventory" | "createdAt";

function rangeToDays(r?: string): number {
  return r === "90d" ? 90 : 30;
}
// function sum(nums: number[]) {
//   return nums.reduce((s, n) => s + n, 0);
// }
function pctDelta(curr: number, prev: number): number | null {
  if (!isFinite(prev) || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const range = (url.searchParams.get("range") as Range) || "30d";
  const q = url.searchParams.get("q")?.trim() ?? "";
  const sort = (url.searchParams.get("sort") as SortKey) || "revenue";
  const dir = (url.searchParams.get("dir") as Dir) || "desc";
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") ?? 20), 100));

  const tenantId = "tenant_demo";
  const days = rangeToDays(range);
  const now = Date.now();
  const sinceCurrent = new Date(now - days * 24 * 60 * 60 * 1000);
  const sincePrevious = new Date(now - 2 * days * 24 * 60 * 60 * 1000);

  try {
    type AggRow = {
      id: string;
      title: string;
      sku: string | null;
      price: number;
      cost: number;
      inventory: number;
      createdAt: Date;
      units: number;
      revenue: number;
      margin: number;
    };

    // "OrderItem" (oi): "quantity", "unitPrice", "orderId", "productId"
    // "Order" (o): "tenantId", "createdAt"
    // "Product" (p): "id","title","sku","price","cost","inventory","tenantId","createdAt"
    const current: AggRow[] = await prisma.$queryRaw`
      SELECT
        p.id,
        p.title,
        p.sku,
        p.price::float8 AS price,
        p.cost::float8 AS cost,
        p.inventory,
        p."createdAt",
        COALESCE(SUM(oi."quantity")::int, 0)                    AS units,
        COALESCE(SUM(oi."quantity" * oi."unitPrice")::float8,0) AS revenue,
        COALESCE(SUM(oi."quantity" * (oi."unitPrice" - p."cost"))::float8, 0) AS margin
      FROM "OrderItem" oi
      JOIN "Order" o       ON o.id = oi."orderId"
      JOIN "Product" p     ON p.id = oi."productId"
      WHERE o."tenantId" = ${tenantId}
        AND o."createdAt" >= ${sinceCurrent}
        AND (${q === ""} OR p.title ILIKE ${"%" + q + "%"} OR p.sku ILIKE ${"%" + q + "%"})
      GROUP BY p.id, p.title, p.sku, p.price, p.cost, p.inventory, p."createdAt"
    `;

    const previous: { id: string; units: number; revenue: number }[] = await prisma.$queryRaw`
      SELECT
        p.id,
        COALESCE(SUM(oi."quantity")::int, 0)                    AS units,
        COALESCE(SUM(oi."quantity" * oi."unitPrice")::float8,0) AS revenue
      FROM "OrderItem" oi
      JOIN "Order" o   ON o.id = oi."orderId"
      JOIN "Product" p ON p.id = oi."productId"
      WHERE o."tenantId" = ${tenantId}
        AND o."createdAt" >= ${sincePrevious}
        AND o."createdAt" <  ${sinceCurrent}
        AND (${q === ""} OR p.title ILIKE ${"%" + q + "%"} OR p.sku ILIKE ${"%" + q + "%"})
      GROUP BY p.id
    `;

    // Map previous by product id for deltas
    const prevMap = new Map(previous.map((r) => [r.id, r]));

    // Merge + compute deltas
    const merged = current.map((r) => {
      const prev = prevMap.get(r.id);
      const deltaRevenuePct = prev ? pctDelta(r.revenue, prev.revenue) : null;
      const deltaUnitsPct = prev ? pctDelta(r.units, prev.units) : null;
      return { ...r, deltaRevenuePct, deltaUnitsPct };
    });

    // Sort
    const sorted = [...merged].sort((a, b) => {
      const mult = dir === "asc" ? 1 : -1;
      switch (sort) {
        case "units":      return mult * (a.units - b.units);
        case "margin":     return mult * (a.margin - b.margin);
        case "inventory":  return mult * ((a.inventory ?? 0) - (b.inventory ?? 0));
        case "createdAt":  return mult * (a.createdAt.getTime() - b.createdAt.getTime());
        case "revenue":
        default:           return mult * (a.revenue - b.revenue);
      }
    }).slice(0, limit);

    return NextResponse.json({ items: sorted });
  } catch (e) {
    console.error("[/api/products/top] error:", e);
    return NextResponse.json({ error: "products_top_failed" }, { status: 500 });
  }
}