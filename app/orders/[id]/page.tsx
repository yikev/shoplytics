// app/orders/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Paper, Title, Text, Group, Table, Divider, Button } from "@mantine/core";
import StatusChanger from "./StatusChanger";

type OrderStatus = "PENDING" | "PAID" | "CANCELLED";

type OrderItemRow = {
  id: string;
  quantity: number;
  unitPrice: unknown; // Prisma Decimal
  discount: unknown;  // Prisma Decimal
  product: { id: string; sku: string | null; title: string };
};

type OrderDetail = {
  id: string;
  createdAt: Date;
  status: OrderStatus;
  subtotal: unknown; // Prisma Decimal
  tax: unknown;      // Prisma Decimal
  shipping: unknown; // Prisma Decimal
  total: unknown;    // Prisma Decimal
  customer: { email: string | null; id: string } | null;
  items: OrderItemRow[];
};

const toNum = (v: unknown) => Number(v ?? 0);

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await props.params;

  const rawOrder = await prisma.order.findFirst({
    where: { id, tenantId: "tenant_demo" },
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

  const order = rawOrder as unknown as OrderDetail | null;

  if (!order) {
    return (
      <div className="p-6">
        <Title order={2}>Order not found</Title>
        <Button mt="md" component={Link} href="/orders">
          Back to orders
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Title order={2}>Order {order.id}</Title>
        <Button component={Link} href="/orders" variant="light">
          Back to orders
        </Button>
      </Group>

      <Paper withBorder p="lg" radius="md">
        {/* Header row: customer + placed + status changer */}
        <Group justify="space-between">
          <Group>
            <Text>
              <b>Customer:</b> {order.customer?.email ?? "—"}
            </Text>
            <Divider orientation="vertical" />
            <Text>
              <b>Placed:</b> {new Date(order.createdAt).toLocaleString()}
            </Text>
          </Group>

          {/* Only the island shows & controls the current status */}
          <StatusChanger id={order.id} status={order.status} />
        </Group>

        <Divider my="md" />

        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th style={{ textAlign: "right" }}>Qty</th>
              <th style={{ textAlign: "right" }}>Unit</th>
              <th style={{ textAlign: "right" }}>Discount</th>
              <th style={{ textAlign: "right" }}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => {
              const unit = toNum(it.unitPrice);
              const disc = toNum(it.discount);
              const line = it.quantity * unit - disc;
              return (
                <tr key={it.id}>
                  <td>{it.product.title}</td>
                  <td>{it.product.sku}</td>
                  <td style={{ textAlign: "right" }}>{it.quantity}</td>
                  <td style={{ textAlign: "right" }}>${unit.toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>${disc.toFixed(2)}</td>
                  <td style={{ textAlign: "right" }}>${line.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>

        <Group justify="flex-end" mt="md">
          <Paper p="md" withBorder radius="md">
            <Text>Subtotal: <b>${toNum(order.subtotal).toFixed(2)}</b></Text>
            <Text>Tax: <b>${toNum(order.tax).toFixed(2)}</b></Text>
            <Text>Shipping: <b>${toNum(order.shipping).toFixed(2)}</b></Text>
            <Divider my={6} />
            <Text size="lg">Total: <b>${toNum(order.total).toFixed(2)}</b></Text>
          </Paper>
        </Group>
      </Paper>
    </div>
  );
}