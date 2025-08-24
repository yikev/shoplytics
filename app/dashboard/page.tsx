import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Paper, Text, Group, Grid, GridCol, Title, Space, Button } from "@mantine/core";
import KpiCard from "@/components/KpiCard";
import SalesChart from "@/components/SalesChart";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const email = session.user?.email ?? "guest";
  const tenantId = (session.user as any)?.tenant_id ?? "tenant_demo";

  // --- KPIs (last 30 days) ---
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: { tenantId, createdAt: { gte: since } },
    select: { total: true },
  });

  const totals = orders.map((o) => Number(o.total));
  const revenue = totals.reduce((s, x) => s + x, 0);
  const ordersCount = orders.length;
  const AOV = ordersCount ? revenue / ordersCount : 0;
  // Demo conversion (fake visits for now)
  const conversion = (ordersCount / (30 * 1000)) * 100; // %

  return (
    <div className="p-6">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Dashboard</Title>
        {/* NextAuth sign out (POST). Simple way: link to the signout route which renders a confirm form */}
        <Button component="a" href="/api/auth/signout">Sign out</Button>
      </Group>

      <Paper withBorder p="lg" radius="md" mb="lg">
        <Text size="lg">
          Hello <b>{tenantId}</b> ({email}) 👋
        </Text>
        <Text c="dimmed" size="sm">
          You’re signed in. Below are live KPIs from your seeded database.
        </Text>
      </Paper>

      <Grid gutter="md">
        <GridCol span={{ base: 12, sm: 6, md: 3 }}>
          <KpiCard label="Revenue (30d)" value={revenue} prefix="$" />
        </GridCol>
        <GridCol span={{ base: 12, sm: 6, md: 3 }}>
          <KpiCard label="Orders (30d)" value={ordersCount} />
        </GridCol>
        <GridCol span={{ base: 12, sm: 6, md: 3 }}>
          <KpiCard label="AOV (30d)" value={AOV} prefix="$" />
        </GridCol>
        <GridCol span={{ base: 12, sm: 6, md: 3 }}>
          <KpiCard label="Conversion (demo)" value={conversion} suffix="%" />
        </GridCol>

        <GridCol span={12}>
          {/* 90‑day sales line chart from /api/sales */}
          <SalesChart days={90} />
        </GridCol>
      </Grid>

      <Space h="xl" />
    </div>
  );
}