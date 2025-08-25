import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Paper, Title, Text, Badge, Group } from "@mantine/core";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const demo = process.env.USE_DEMO_DATA === "true";

  return (
    <div className="p-6">
      <Title order={2}>Settings</Title>
      <Paper withBorder radius="md" p="md" mt="md">
        <Group>
          <Text>Mode:</Text>
          <Badge color={demo ? "blue" : "green"}>{demo ? "Demo data" : "Live"}</Badge>
        </Group>
        <Text c="dimmed" size="sm" mt="sm">
          In demo mode, data comes from seeded Postgres. Shopify connect is planned for a future phase.
        </Text>
      </Paper>
    </div>
  );
}