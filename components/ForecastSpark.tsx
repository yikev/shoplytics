"use client";
import { useEffect, useState } from "react";
import { Card, Loader, Center, Text, Group } from "@mantine/core";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
} from "recharts";

type Point = { date?: string; revenue?: number; forecast?: number; low?: number; high?: number };

enum SeriesKey {
  Revenue = "revenue",
  Forecast = "forecast",
  Low = "low",
  High = "high",
}

export default function ForecastSpark() {
  const [data, setData] = useState<Point[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    fetch("/api/insights/forecast", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(({ last90, forecast, band }: { last90: { date: string; revenue: number }[]; forecast: number[]; band?: { low: number; high: number }[] }) => {
        const past: Point[] = last90.map((p) => ({ date: p.date, revenue: p.revenue }));
        const future: Point[] = forecast.map((y, i) => ({
          date: `F+${i + 1}`,
          forecast: y,
          low: band?.[i]?.low,
          high: band?.[i]?.high,
        }));
        setData([...past, ...future]);
      })
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setErr(String(e));
        }
      });

    return () => ac.abort();
  }, []);

  if (err)
    return (
      <Card withBorder p="md">
        <Text c="red">Failed to load forecast</Text>
      </Card>
    );
  if (!data)
    return (
      <Card withBorder p="md">
        <Center className="h-40">
          <Loader />
        </Center>
      </Card>
    );

  const lastPoint = data[data.length - 1];

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
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            {/* Confidence band (plots low/high as translucent areas) */}
            <Area type="monotone" dataKey={SeriesKey.High} dot={false} connectNulls />
            <Area type="monotone" dataKey={SeriesKey.Low} dot={false} connectNulls />
            {/* Actuals and forecast */}
            <Line type="monotone" dataKey={SeriesKey.Revenue} connectNulls />
            <Line type="monotone" dataKey={SeriesKey.Forecast} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}