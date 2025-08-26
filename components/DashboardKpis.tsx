// components/DashboardKpis.tsx
"use client";

import { useEffect, useState } from "react";
import { Grid, GridCol, Loader, Center, Group, SegmentedControl, Paper } from "@mantine/core";
import KpiCard from "@/components/KpiCard";

type Kpis = {
  range: "30d" | "90d";
  revenue: number;
  orders: number;
  aov: number;
  conversion: number;
  deltaRevenuePct: number | null;
  deltaOrdersPct: number | null;
  deltaAovPct: number | null;
  deltaConversionPct: number | null;
};

export default function DashboardKpis() {
  const [range, setRange] = useState<"30d" | "90d">("30d");
  const [data, setData] = useState<Kpis | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setErr(null);
    setData(null);
    fetch(`/api/kpis?range=${range}`, { signal: ac.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setData)
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) setErr(String(e));
      });
    return () => ac.abort();
  }, [range]);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <SegmentedControl
          value={range}
          onChange={(v) => setRange((v as "30d" | "90d") ?? "30d")}
          data={[
            { value: "30d", label: "Last 30d" },
            { value: "90d", label: "Last 90d" },
          ]}
        />
      </Group>

      {err && (
        <Paper withBorder p="sm" radius="md" style={{ color: "red" }}>
          Failed to load KPIs: {err}
        </Paper>
      )}

      {!data && !err && (
        <Center style={{ height: 80 }}>
          <Loader />
        </Center>
      )}

      {data && (
        <Grid gutter="md">
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <KpiCard label="Revenue" value={data.revenue} prefix="$" deltaPct={data.deltaRevenuePct} />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <KpiCard label="Orders" value={data.orders} deltaPct={data.deltaOrdersPct} />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <KpiCard label="AOV" value={data.aov} prefix="$" deltaPct={data.deltaAovPct} />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <KpiCard label="Conversion" value={data.conversion} suffix="%" deltaPct={data.deltaConversionPct} />
          </GridCol>
        </Grid>
      )}
    </div>
  );
}