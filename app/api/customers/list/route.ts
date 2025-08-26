export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

type SortKey = "totalSpent" | "ordersCount" | "createdAt";

export async function GET(req: Request) {
  const tenantId = "tenant_demo";
  const url = new URL(req.url);

  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Number(url.searchParams.get("pageSize") ?? 20));
  const q = (url.searchParams.get("q") ?? "").trim();

  const sortParam = (url.searchParams.get("sort") ?? "totalSpent") as SortKey;
  const dirParam: Prisma.SortOrder =
    url.searchParams.get("dir") === "asc" ? "asc" : "desc";

  const orderBy: Prisma.CustomerOrderByWithRelationInput =
    sortParam === "totalSpent"
      ? { totalSpent: dirParam }
      : sortParam === "ordersCount"
      ? { ordersCount: dirParam }
      : { createdAt: dirParam };

  const where: Prisma.CustomerWhereInput = {
    tenantId,
    ...(q
      ? {
          email: {
            contains: q,
            mode: "insensitive",
          },
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
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