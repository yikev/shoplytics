"use client";
import { useEffect, useState } from "react";
import { Card, Loader, Center, Text, Group } from "@mantine/core";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function ForecastSpark() {
  const [data, setData] = useState<{ date?: string; revenue?: number; forecast?: number }[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/insights/forecast")
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(({ last90, forecast }) => {
        const forecastSeries = forecast.map((y: number, i: number) => ({ date: `F+${i+1}`, forecast: y }));
        setData([...last90, ...forecastSeries]);
      })
      .catch(e => setErr(String(e)));
  }, []);

  if (err) return <Card withBorder p="md"><Text c="red">Failed to load forecast</Text></Card>;
  if (!data) return <Card withBorder p="md"><Center className="h-40"><Loader /></Center></Card>;

  const lastPoint = data.slice(-1)[0];
  return (
    <Card withBorder radius="md" p="md">
      <Group justify="space-between" mb="xs">
        <Text fw={700}>30‑day Forecast</Text>
        <Text size="sm" c="dimmed">
          Next day est: {typeof lastPoint?.forecast === "number" ? `$${lastPoint.forecast.toFixed(2)}` : "—"}
        </Text>
      </Group>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" />
            <Line type="monotone" dataKey="forecast" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}