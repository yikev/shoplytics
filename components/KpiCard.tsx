// components/KpiCard.tsx
"use client";

import { Card, Group, Text, Badge } from "@mantine/core";

export default function KpiCard({
  label,
  value,
  prefix,
  suffix,
  deltaPct,
}: {
  label: string;
  value: number;
  prefix?: string; // e.g. "$"
  suffix?: string; // e.g. "%"
  deltaPct?: number | null; // +/- percent vs prior period
}) {
  const isPercent = suffix === "%";
  const display = isPercent
    ? `${value.toFixed(2)}%`
    : prefix === "$"
    ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : value.toLocaleString();

  let deltaText = "—";
  let deltaColor: "green" | "red" | "gray" = "gray";
  if (typeof deltaPct === "number" && isFinite(deltaPct)) {
    const sign = deltaPct >= 0 ? "+" : "";
    deltaText = `${sign}${deltaPct.toFixed(1)}%`;
    deltaColor = deltaPct >= 0 ? "green" : "red";
  }

  return (
    <Card withBorder radius="md" p="md">
      <Group justify="space-between" mb={6} wrap="nowrap">
        <Text c="dimmed" size="sm">
          {label}
        </Text>
        <Badge color={deltaColor} variant="light" size="sm">
          {deltaText}
        </Badge>
      </Group>
      <Text fw={700} fz="xl">
        {display}
      </Text>
    </Card>
  );
}