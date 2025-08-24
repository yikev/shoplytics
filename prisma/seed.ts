import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TENANT = 'tenant_demo';

// simple gaussian-ish noise
function randn(mean: number, sd: number) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

async function main() {
  console.log('Seeding tenant', TENANT);
  await prisma.tenant.upsert({
    where: { id: TENANT },
    update: {},
    create: { id: TENANT, name: 'Demo Store' },
  });

  // 1) products
  const products = Array.from({ length: 50 }).map((_, i) => ({
    id: `prod_${i + 1}`,
    tenantId: TENANT,
    sku: `SKU-${1000 + i}`,
    title: `Product ${i + 1}`,
    price: (1999 + (i % 10) * 250) / 100, // 19.99–44.99
    cost: (900 + (i % 8) * 150) / 100,    // 9.00–20.50
    inventory: 50 + (i % 30),
    tags: [i % 2 ? 'summer' : 'winter'],
  }));
  await prisma.product.createMany({ data: products });

  // 2) customers
  const customers = Array.from({ length: 500 }).map((_, i) => ({
    id: `cust_${i + 1}`,
    tenantId: TENANT,
    email: `customer${i + 1}@example.com`,
    firstName: `First${i + 1}`,
    lastName: `Last${i + 1}`,
    totalSpent: 0,
    ordersCount: 0,
  }));
  await prisma.customer.createMany({ data: customers });

  // 3) orders + items for last 18 months with weekend/seasonality
  const today = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 18);

  const orderRows: any[] = [];
  const itemRows: any[] = [];
  let ord = 1, item = 1;

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    const month = d.getMonth();
    const weekend = (dow === 0 || dow === 6) ? 1.2 : 1.0;
    const seasonal = [10,11].includes(month) ? 1.5 : ([5,6].includes(month) ? 1.3 : 1.0);
    const base = 20 * weekend * seasonal;
    const ordersToday = Math.max(0, Math.round(randn(base, Math.max(1, base * 0.25))));

    for (let j = 0; j < ordersToday; j++) {
      const id = `ord_${ord++}`;
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const itemsCount = 1 + Math.floor(Math.random() * 3);
      const createdAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(Math.random() * 24));

      let subtotal = 0;
      const chosen = new Set<number>();
      for (let k = 0; k < itemsCount; k++) {
        let idx = Math.floor(Math.random() * products.length);
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
      });
    }
  }

  console.log('Creating orders:', orderRows.length, 'items:', itemRows.length);
  const chunk = 2000;
  for (let i = 0; i < orderRows.length; i += chunk) {
    await prisma.order.createMany({ data: orderRows.slice(i, i + chunk) });
  }
  for (let i = 0; i < itemRows.length; i += chunk) {
    await prisma.orderItem.createMany({ data: itemRows.slice(i, i + chunk) });
  }

  // backfill customer aggregates
  const orders = await prisma.order.findMany({
    where: { tenantId: TENANT },
    select: { total: true, customerId: true },
  });

  const byCust: Record<string, { total: number; count: number }> = {};
  for (const o of orders) {
    if (!o.customerId) continue;
    byCust[o.customerId] ??= { total: 0, count: 0 };
    byCust[o.customerId].total += Number(o.total);
    byCust[o.customerId].count += 1;
  }

  await Promise.all(
    Object.entries(byCust).map(([id, v]) =>
      prisma.customer.update({
        where: { id },
        data: { totalSpent: v.total, ordersCount: v.count },
      })
    )
  );

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });