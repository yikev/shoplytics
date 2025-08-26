// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Paper, Text, Group, Title, Space, Button } from "@mantine/core";
import Link from "next/link";
import DashboardKpis from "@/components/DashboardKpis";
import SalesChart from "@/components/SalesChart";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const email = session.user?.email ?? "guest";
  const tenantId = session.user?.tenant_id ?? "tenant_demo";

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

      <DashboardKpis />

      <Space h="lg" />

      <SalesChart days={90} />
    </div>
  );
}