import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: Request) {
  const tenantId = "tenant_demo";
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Number(url.searchParams.get("pageSize") ?? 20));
  const sort = url.searchParams.get("sort") ?? "totalSpent";
  const dir = (url.searchParams.get("dir") ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where: { tenantId } }),
    prisma.customer.findMany({
      where: { tenantId },
      orderBy: { [sort]: dir as any },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, email: true, ordersCount: true, totalSpent: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    items: rows.map(r => ({
      ...r,
      totalSpent: Number(r.totalSpent),
    })),
  });
}