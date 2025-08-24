"use client";
import { useEffect, useState } from "react";
import { Card, Loader, Center, Text, Group } from "@mantine/core";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function SegmentsPie() {
  const [data, setData] = useState<{ name: string; value: number }[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/insights/segments")
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(({ buckets }) => {
        setData([
          { name: "High value", value: buckets.high },
          { name: "Mid value", value: buckets.mid },
          { name: "Low value", value: buckets.low },
        ]);
      })
      .catch(e => setErr(String(e)));
  }, []);

  if (err) return <Card withBorder p="md"><Text c="red">Failed to load segments</Text></Card>;
  if (!data) return <Card withBorder p="md"><Center className="h-40"><Loader /></Center></Card>;

  return (
    <Card withBorder radius="md" p="md">
      <Group justify="space-between" mb="xs">
        <Text fw={700}>Customer Segments</Text>
        <Text size="sm" c="dimmed">Demo buckets</Text>
      </Group>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie dataKey="value" data={data} outerRadius={90} label />
            {/* Recharts uses default colors; we won't specify colors per your setup */}
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}