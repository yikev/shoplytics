import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type SortKey = "totalSpent" | "ordersCount" | "createdAt";

export async function GET(req: Request) {
  const tenantId = "tenant_demo";
  const url = new URL(req.url);

  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Number(url.searchParams.get("pageSize") ?? 20));

  const sortParam = (url.searchParams.get("sort") ?? "totalSpent") as SortKey;
  const dirParam: Prisma.SortOrder =
    url.searchParams.get("dir") === "asc" ? "asc" : "desc";

  // Map dynamic key to a typed orderBy object
  const orderBy: Prisma.CustomerOrderByWithRelationInput =
    sortParam === "totalSpent"
      ? { totalSpent: dirParam }
      : sortParam === "ordersCount"
      ? { ordersCount: dirParam }
      : { createdAt: dirParam };

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where: { tenantId } }),
    prisma.customer.findMany({
      where: { tenantId },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        ordersCount: true,
        totalSpent: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    items: rows.map((r) => ({ ...r, totalSpent: Number(r.totalSpent) })),
  });
}