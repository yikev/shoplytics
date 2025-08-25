import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const tenantId = "tenant_demo";
  const customers = await prisma.customer.findMany({ where: { tenantId } });
  const total = customers.length;
  const returning = customers.filter((c) => c.ordersCount > 1).length;
  const newCount = total - returning;
  const ltvAvg = customers.length
    ? customers.reduce((s, c) => s + Number(c.totalSpent), 0) / customers.length
    : 0;
  return NextResponse.json({ total, newCount, returning, ltvAvg });
}