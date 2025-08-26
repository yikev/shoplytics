// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const TENANT = "tenant_demo";

// Use string literals that match your schema enum exactly
const ORDER_STATUSES = ["PENDING", "PAID", "CANCELLED"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

function randomStatus(): OrderStatus {
  const r = Math.random();
  if (r < 0.6) return "PAID";
  if (r < 0.8) return "CANCELLED"; // or tweak probabilities as you like
  return "PENDING";
}

function randn(mean: number, sd: number) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

async function main() {
  console.log("Seeding tenant", TENANT);

  // Clean just this tenant (FK order: OrderItem -> Order -> Customer/Product)
  await prisma.orderItem.deleteMany({ where: { order: { tenantId: TENANT } } });
  await prisma.order.deleteMany({ where: { tenantId: TENANT } });
  await prisma.customer.deleteMany({ where: { tenantId: TENANT } });
  await prisma.product.deleteMany({ where: { tenantId: TENANT } });

  // Ensure tenant exists
  await prisma.tenant.upsert({
    where: { id: TENANT },
    update: {},
    create: { id: TENANT, name: "Demo Store" },
  });

  // Debug: see the enum labels in Postgres
    const dbEnumLabels = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
    SELECT e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'OrderStatus'
    ORDER BY e.enumsortorder;
    `;
    console.log("DB OrderStatus labels:", dbEnumLabels.map(r => r.enumlabel));

  // Products
  const products = Array.from({ length: 50 }).map((_, i) => ({
    id: `prod_${i + 1}`,
    tenantId: TENANT,
    sku: `SKU-${1000 + i}`,
    title: `Product ${i + 1}`,
    price: (1999 + (i % 10) * 250) / 100, // 19.99–44.99
    cost: (900 + (i % 8) * 150) / 100,    // 9.00–20.50
    inventory: 50 + (i % 30),
    tags: [i % 2 ? "summer" : "winter"],
  }));
  await prisma.product.createMany({ data: products, skipDuplicates: true });

  // Customers
  const customers = Array.from({ length: 500 }).map((_, i) => ({
    id: `cust_${i + 1}`,
    tenantId: TENANT,
    email: `customer${i + 1}@example.com`,
    firstName: `First${i + 1}`,
    lastName: `Last${i + 1}`,
    totalSpent: 0,
    ordersCount: 0,
  }));
  await prisma.customer.createMany({ data: customers, skipDuplicates: true });

  // Orders + items over last 18 months
  const today = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 18);

  type OrderRow = {
    id: string;
    tenantId: string;
    customerId: string;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    createdAt: Date;
    status: OrderStatus;
  };

  type ItemRow = {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  };

  const orderRows: OrderRow[] = [];
  const itemRows: ItemRow[] = [];
  let ord = 1;
  let item = 1;

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    const month = d.getMonth();
    const weekend = dow === 0 || dow === 6 ? 1.2 : 1.0;
    const seasonal = [10, 11].includes(month) ? 1.5 : [5, 6].includes(month) ? 1.3 : 1.0;
    const base = 20 * weekend * seasonal;
    const ordersToday = Math.max(0, Math.round(randn(base, Math.max(1, base * 0.25))));

    for (let j = 0; j < ordersToday; j++) {
      const id = `ord_${ord++}`;
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const itemsCount = 1 + Math.floor(Math.random() * 3);
      const createdAt = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        Math.floor(Math.random() * 24)
      );

      let subtotal = 0;
      const chosen = new Set<number>();
      for (let k = 0; k < itemsCount; k++) {
        const idx = Math.floor(Math.random() * products.length);
        if (chosen.has(idx)) continue;
        chosen.add(idx);

        const p = products[idx];
        const qty = 1 + Math.floor(Math.random() * 2);
        const unitPrice = p.price;
        subtotal += unitPrice * qty;

        itemRows.push({
          id: `item_${item++}`,
          orderId: id,
          productId: p.id,
          quantity: qty,
          unitPrice,
          discount: 0,
        });
      }

      const tax = subtotal * 0.12;
      const shipping = subtotal > 100 ? 0 : 9.99;
      const total = subtotal + tax + shipping;

      orderRows.push({
        id,
        tenantId: TENANT,
        customerId: customer.id,
        subtotal,
        tax,
        shipping,
        total,
        createdAt,
        status: randomStatus(),
      });
    }
  }

  console.log("Creating orders:", orderRows.length, "items:", itemRows.length);
  const chunk = 2000;
  for (let i = 0; i < orderRows.length; i += chunk) {
    await prisma.order.createMany({ data: orderRows.slice(i, i + chunk) });
  }
  for (let i = 0; i < itemRows.length; i += chunk) {
    await prisma.orderItem.createMany({ data: itemRows.slice(i, i + chunk) });
  }

  await prisma.$executeRaw`
  UPDATE "Customer" c
  SET "totalSpent" = COALESCE(s.total, 0)::numeric,
      "ordersCount" = COALESCE(s.count, 0)
  FROM (
    SELECT "customerId" AS id,
           SUM("total")   AS total,
           COUNT(*)       AS count
    FROM "Order"
    WHERE "tenantId" = ${TENANT}
      AND "customerId" IS NOT NULL
    GROUP BY "customerId"
  ) s
  WHERE c.id = s.id
    AND c."tenantId" = ${TENANT};
`;

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });