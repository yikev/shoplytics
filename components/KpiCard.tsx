// components/KpiCard.tsx
"use client";

import { Card, Group, Text, Badge, Tooltip } from "@mantine/core";
import { IconArrowUpRight, IconArrowDownRight, IconMinus } from "@tabler/icons-react";

type Props = {
  label: string;
  value: number;
  prefix?: string;      // e.g. "$"
  suffix?: string;      // e.g. "%"
  deltaPct?: number | null; // +/- vs previous period, in %
  goodWhenLower?: boolean;  // if true, negative deltas are green
  decimals?: number;        // decimals for value when suffix is "%"; default 2
  compact?: boolean;        // tighter padding/typography
};

export default function KpiCard({
  label,
  value,
  prefix,
  suffix,
  deltaPct,
  goodWhenLower = false,
  decimals,
  compact = false,
}: Props) {
  const isPercentValue = suffix === "%";

  const formattedValue = isPercentValue
    ? `${value.toFixed(decimals ?? 2)}%`
    : prefix === "$"
    ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      `.trim()
    : value.toLocaleString();

  // --- Delta formatting ---
  const hasDelta = typeof deltaPct === "number" && isFinite(deltaPct);
  const deltaAbs = hasDelta ? Math.abs(deltaPct!) : null;

  // Choose color depending on whether lower is better
  let color: "green" | "red" | "gray" = "gray";
  if (hasDelta) {
    const positiveIsGood = !goodWhenLower;     // by default higher is better
    const isPositive = deltaPct! >= 0;
    color = (isPositive === positiveIsGood) ? "green" : "red";
  }

  const DeltaIcon = !hasDelta
    ? IconMinus
    : deltaPct! >= 0
    ? IconArrowUpRight
    : IconArrowDownRight;

  const deltaLabel = hasDelta
    ? `${deltaPct! >= 0 ? "+" : "-"}${deltaAbs!.toFixed(1)}%`
    : "—";

  const cardPad = compact ? "sm" : "md";
  const valueSize = compact ? "lg" : "xl";

  return (
    <Card withBorder radius="md" p={cardPad}>
      <Group justify="space-between" mb={compact ? 4 : 6} wrap="nowrap">
        <Text c="dimmed" size={compact ? "xs" : "sm"}>
          {label}
        </Text>

        <Tooltip label={hasDelta ? "vs. previous period" : "No prior-period data"}>
          <Badge
            color={color}
            variant="light"
            size={compact ? "xs" : "sm"}
            leftSection={<DeltaIcon size={14} style={{ marginRight: 2 }} />}
          >
            {deltaLabel}
          </Badge>
        </Tooltip>
      </Group>

      <Text fw={700} fz={valueSize}>
        {formattedValue}
      </Text>
    </Card>
  );
}