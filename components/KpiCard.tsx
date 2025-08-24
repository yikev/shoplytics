"use client";

import { Card, Group, Text } from "@mantine/core";

export default function KpiCard({
  label,
  value,
  prefix = "",
  suffix = "",
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const formatted =
    prefix ? `${prefix}${value.toLocaleString()}` : `${value.toLocaleString()}`;
  return (
    <Card withBorder radius="md" p="md">
      <Text c="dimmed" size="sm">{label}</Text>
      <Group justify="space-between" mt={6}>
        <Text fw={700} size="xl">
          {formatted}{suffix}
        </Text>
      </Group>
    </Card>
  );
}