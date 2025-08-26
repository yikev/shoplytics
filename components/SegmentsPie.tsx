"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Text, Center } from "@mantine/core";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend } from "recharts";

export type Slice = { name: string; value: number };

export default function SegmentsPie({ data = [] }: { data?: Slice[] }) {
  const router = useRouter();

  const total = useMemo(
    () => data.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    [data]
  );

  const legendFmt = (value: string, entry: any) => {
    const count = entry?.payload?.value ?? 0;
    const pct = total ? Math.round((count / total) * 100) : 0;
    return `${value} — ${count} (${pct}%)`;
  };

  // Map display label -> query value
  const labelToKey = useCallback((label: string) => {
    const s = label.toLowerCase();
    if (s.startsWith("high")) return "high";
    if (s.startsWith("mid")) return "mid";
    if (s.startsWith("low")) return "low";
    return "";
  }, []);

  const onSliceClick = useCallback(
    (_: any, index: number) => {
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
                onClick={onSliceClick}   // 👈 navigate on click
                cursor="pointer"
              />
              <Tooltip formatter={(v: number) => [`${v} customers`, "Count"]} />
              <Legend formatter={legendFmt} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}