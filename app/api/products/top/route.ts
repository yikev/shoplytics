export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SortKey = "revenue" | "units" | "margin" | "inventory" | "createdAt";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(50, Number(url.searchParams.get("limit") ?? 20));
  const sort = (url.searchParams.get("sort") as SortKey) || "revenue";
  const dir = url.searchParams.get("dir") === "asc" ? "asc" : "desc";
  const tenantId = "tenant_demo";

  // Pull products and join order items to compute units & revenue
  const items = await prisma.product.findMany({
    where: {
      tenantId,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      sku: true,
      price: true,
      cost: true,
      inventory: true,
      createdAt: true,
      orderItems: {
        select: { quantity: true, unitPrice: true, discount: true },
      },
    },
  });

  const rows = items.map((p) => {
    const units = p.orderItems.reduce((s, oi) => s + oi.quantity, 0);
    const revenue = p.orderItems.reduce((s, oi) => {
      const priceNum = Number(oi.unitPrice);
      const discountNum = Number(oi.discount ?? 0);
      return s + priceNum * oi.quantity - discountNum;
    }, 0);
    const cogs = Number(p.cost) * units;
    const margin = revenue - cogs;
    return {
      id: p.id,
      title: p.title,
      sku: p.sku ?? "",
      price: Number(p.price),
      cost: Number(p.cost),
      inventory: p.inventory,
      createdAt: p.createdAt,
      units,
      revenue,
      margin,
    };
  });

  const sorted = rows.sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case "revenue":
        cmp = a.revenue - b.revenue; break;
      case "units":
        cmp = a.units - b.units; break;
      case "margin":
        cmp = a.margin - b.margin; break;
      case "inventory":
        cmp = a.inventory - b.inventory; break;
      case "createdAt":
        cmp = a.createdAt.getTime() - b.createdAt.getTime(); break;
      default:
        cmp = 0;
    }
    return dir === "asc" ? cmp : -cmp;
  });

  return NextResponse.json({ items: sorted.slice(0, limit) });
}