"use client";
import { useEffect, useState } from "react";
import { Card, Loader, Center, Text } from "@mantine/core";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function SalesChart({ days = 90 }: { days?: number }) {
  const [data, setData] = useState<{ date: string; revenue: number }[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sales?days=${days}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, [days]);

  if (err) {
    return (
      <Card withBorder radius="md" p="md" style={{ height: 320 }}>
        <Center className="h-full"><Text c="red">Failed to load chart</Text></Center>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card withBorder radius="md" p="md" style={{ height: 320 }}>
        <Center className="h-full"><Loader /></Center>
      </Card>
    );
  }

  return (
    <Card withBorder radius="md" p="md" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}