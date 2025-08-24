import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button, Paper, Title, Text, Group } from "@mantine/core";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const email = session.user?.email ?? "guest";
  const tenantId = (session.user as any)?.tenant_id ?? "tenant_demo";

  return (
    <div className="p-6">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Dashboard</Title>
        <Button component={Link} href="/api/auth/signout">Sign out</Button>
      </Group>

      <Paper withBorder p="lg" radius="md">
        <Text size="lg">Hello <b>{tenantId}</b> ({email}) 👋</Text>
        <Text c="dimmed" size="sm">You’re signed in. Next: render KPI cards and charts here.</Text>
      </Paper>
    </div>
  );
}