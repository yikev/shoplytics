"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Text, Center } from "@mantine/core";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend } from "recharts";
import type { LegendPayload } from "recharts/types/component/DefaultLegendContent";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

export type Slice = { name: string; value: number };

export default function SegmentsPie({ data = [] }: { data?: Slice[] }) {
  const router = useRouter();

  const total = useMemo(
    () => data.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    [data]
  );

  // Legend: (value, entry) => ReactNode
  const legendFmt = (value: string, entry: LegendPayload): string => {
    const payload = entry?.payload as Partial<Slice> | undefined;
    const count = Number(payload?.value ?? 0);
    const pct = total ? Math.round((count / total) * 100) : 0;
    return `${value} — ${count} (${pct}%)`;
  };

  // Tooltip: (value, name) => ReactNode
  const tooltipFmt = (value: ValueType, _name: NameType): [string, string] => {
    return [`${Number(value)} customers`, "Count"];
  };

  const labelToKey = useCallback((label: string) => {
    const s = label.toLowerCase();
    if (s.startsWith("high")) return "high";
    if (s.startsWith("mid")) return "mid";
    if (s.startsWith("low")) return "low";
    return "";
  }, []);

  // Avoid typing the Pie callback's data arg; use the index to look up our Slice
  const onSliceClick = useCallback(
    (_: unknown, index: number) => {
      const slice = data[index];
      if (!slice) return;
      const key = labelToKey(slice.name);
      if (key) router.push(`/customers?segment=${key}`);
    },
    [data, labelToKey, router]
  );

  return (
    <Card withBorder radius="md" p="md">
      <Text fw={700} mb="xs">Customer Segments</Text>

      {data.length === 0 || total === 0 ? (
        <Center style={{ height: 240 }}>
          <Text c="dimmed">No segment data</Text>
        </Center>
      ) : (
        <div style={{ height: 280, minHeight: 280 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                onClick={onSliceClick}
                style={{ cursor: "pointer" }}
              />
              <Tooltip formatter={tooltipFmt} />
              <Legend formatter={legendFmt} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}