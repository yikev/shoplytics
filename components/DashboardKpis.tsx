// components/DashboardKpis.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Grid,
  GridCol,
  Loader,
  Center,
  Group,
  SegmentedControl,
  Paper,
  Button,
  Text,
} from "@mantine/core";
import KpiCard from "@/components/KpiCard";

type Range = "30d" | "90d";

type Kpis = {
  range: Range;
  revenue: number;
  orders: number;
  aov: number;
  conversion: number; // %
  deltaRevenuePct: number | null;
  deltaOrdersPct: number | null;
  deltaAovPct: number | null;
  deltaConversionPct: number | null;
};

export default function DashboardKpis({
  initialRange = "30d",
  onRangeChange,
}: {
  initialRange?: Range;
  onRangeChange?: (r: Range) => void;
}) {
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<Kpis | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (r: Range) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/kpis?range=${r}`, { signal: ac.signal, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: Kpis = await res.json();
      setData(json);
      setUpdatedAt(new Date());
    } catch (e: unknown) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setErr(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // fire on mount + when range changes
  useEffect(() => {
    onRangeChange?.(range);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("range", range);
      window.history.replaceState({}, "", url.toString());
    }
    load(range);
    return () => abortRef.current?.abort();
  }, [range, load, onRangeChange]);

  return (
    <div>
      <Group justify="space-between" mb="md" align="center" wrap="nowrap">
        <SegmentedControl
          value={range}
          onChange={(v) => setRange((v as Range) ?? "30d")}
          data={[
            { value: "30d", label: "Last 30d" },
            { value: "90d", label: "Last 90d" },
          ]}
        />
        <Group gap="xs">
          {updatedAt && (
            <Text size="xs" c="dimmed">
              Updated {updatedAt.toLocaleTimeString()}
            </Text>
          )}
          <Button size="xs" variant="light" onClick={() => load(range)} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </Group>
      </Group>

      {err && (
        <Paper withBorder p="sm" radius="md" style={{ color: "var(--mantine-color-red-6)" }}>
          <Group justify="space-between" align="center">
            <Text>Failed to load KPIs: {err}</Text>
            <Button size="xs" variant="subtle" onClick={() => load(range)}>
              Try again
            </Button>
          </Group>
        </Paper>
      )}

      {!data && !err && (
        <Center style={{ height: 80 }} aria-live="polite">
          <Loader />
        </Center>
      )}

      {data && (
        <Grid gutter="md">
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <KpiCard label="Revenue" value={data.revenue} prefix="$" deltaPct={data.deltaRevenuePct ?? undefined} />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <KpiCard label="Orders" value={data.orders} deltaPct={data.deltaOrdersPct ?? undefined} />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <KpiCard label="AOV" value={data.aov} prefix="$" decimals={2} deltaPct={data.deltaAovPct ?? undefined} />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6, md: 3 }}>
            <KpiCard label="Conversion" value={data.conversion} suffix="%" decimals={2} deltaPct={data.deltaConversionPct ?? undefined} />
          </GridCol>
        </Grid>
      )}
    </div>
  );
}