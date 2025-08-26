"use client";

import { useMemo } from "react";
import { Card, Text, Center } from "@mantine/core";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend } from "recharts";

export type Slice = { name: string; value: number };

export default function SegmentsPie({ data = [] }: { data?: Slice[] }) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    [data]
  );

  const legendFmt = (value: string, entry: any) => {
    const count = entry?.payload?.value ?? 0;
    const pct = total ? Math.round((count / total) * 100) : 0;
    return `${value} — ${count} (${pct}%)`;
  };

  return (
    <Card withBorder radius="md" p="md">
      <Text fw={700} mb="xs">
        Customer Segments
      </Text>

      {data.length === 0 || total === 0 ? (
        <Center style={{ height: 240 }}>
          <Text c="dimmed">No segment data</Text>
        </Center>
      ) : (
        <div style={{ height: 280, minHeight: 280 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} />
              <Tooltip formatter={(v: number) => [`${v} customers`, "Count"]} />
              <Legend formatter={legendFmt} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}