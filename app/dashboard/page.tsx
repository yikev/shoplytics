// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Paper, Text, Group, Title, Space, Button } from "@mantine/core";
import Link from "next/link";
import DashboardKpis from "@/components/DashboardKpis";
import SalesChart from "@/components/SalesChart";
import RecentOrders from "@/components/RecentOrders";

type PageProps = {
  // 🔴 In Next 15, searchParams is a Promise in server components
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const email = session.user?.email ?? "guest";
  const tenantId = session.user?.tenant_id ?? "tenant_demo";

  // ✅ await searchParams before using it
  const sp = await searchParams;
  const rangeParam = (Array.isArray(sp.range) ? sp.range[0] : sp.range) as
    | "30d"
    | "90d"
    | undefined;

  const range: "30d" | "90d" = rangeParam === "90d" ? "90d" : "30d";
  const days = range === "90d" ? 90 : 30;

  return (
    <div className="p-6">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Dashboard</Title>
        <Button component={Link} href="/api/auth/signout">Sign out</Button>
      </Group>

      <Paper withBorder p="lg" radius="md" mb="lg">
        <Text size="lg">
          Hello <b>{tenantId}</b> ({email}) 👋
        </Text>
        <Text c="dimmed" size="sm">
          KPIs and charts below are computed from your seeded database.
        </Text>
      </Paper>

      <DashboardKpis initialRange={range} />

      <Space h="lg" />

      <Group align="flex-start" grow>
        <SalesChart days={days} />
        <RecentOrders />
      </Group>
    </div>
  );
}