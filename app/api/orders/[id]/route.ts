// app/api/orders/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Status = "PENDING" | "PAID" | "CANCELLED";
const TENANT_ID = "tenant_demo";

function okJson(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  // no-store for dynamic data
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    const order = await prisma.order.findFirst({
      where: { id, tenantId: TENANT_ID },
      select: {
        id: true,
        createdAt: true,
        status: true,
        subtotal: true,
        tax: true,
        shipping: true,
        total: true,
        customer: { select: { email: true, id: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            product: { select: { id: true, sku: true, title: true } },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!order) return okJson({ error: "not_found" }, { status: 404 });

    // Prisma Decimal -> number
    const norm = {
      ...order,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
      })),
    };

    return okJson(norm);
  } catch (e) {
    console.error("[/api/orders/[id]] GET error", e);
    return okJson({ error: "order_fetch_failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    // Basic content-type guard (optional)
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return okJson({ error: "expected_json" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));
    const status = body?.status as Status | undefined;

    if (!status || !["PENDING", "PAID", "CANCELLED"].includes(status)) {
      return okJson({ error: "bad_status" }, { status: 400 });
    }

    // Ensure the order belongs to this tenant before updating.
    const existing = await prisma.order.findFirst({
      where: { id, tenantId: TENANT_ID },
      select: { id: true },
    });
    if (!existing) return okJson({ error: "not_found" }, { status: 404 });

    await prisma.order.update({
      where: { id }, // safe after the tenant check above
      data: { status },
    });

    // Revalidate list + detail views
    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);

    return okJson({ id, status });
  } catch (e) {
    console.error("[/api/orders/[id]] PATCH error", e);
    return okJson({ error: "order_update_failed" }, { status: 500 });
  }
}