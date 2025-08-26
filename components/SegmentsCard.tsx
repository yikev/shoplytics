// components/SegmentsCard.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Center, Loader, Text, Button, Group } from "@mantine/core";
import SegmentsPie, { Slice } from "@/components/SegmentsPie";

type ApiBuckets = { low?: number; mid?: number; high?: number };
type ApiShape =
  | { buckets?: ApiBuckets; customers?: unknown[] }
  | { segments?: Slice[] | Record<string, number> }
  | Record<string, number>
  | Slice[];

function isBucketsShape(x: unknown): x is { buckets: ApiBuckets } {
  return (
    !!x &&
    typeof x === "object" &&
    "buckets" in (x as any) &&
    (typeof (x as any).buckets === "object" && (x as any).buckets !== null)
  );
}

function isSegmentsArray(x: unknown): x is { segments: Slice[] } {
  return !!x && typeof x === "object" && Array.isArray((x as any).segments);
}

function isSegmentsMap(x: unknown): x is { segments: Record<string, number> } {
  return (
    !!x &&
    typeof x === "object" &&
    "segments" in (x as any) &&
    !Array.isArray((x as any).segments) &&
    typeof (x as any).segments === "object"
  );
}

function isPlainMap(x: unknown): x is Record<string, number> {
  return (
    !!x &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    !("buckets" in (x as any)) &&
    !("segments" in (x as any))
  );
}

function toSlices(json: ApiShape): Slice[] | null {
  if (Array.isArray(json)) return json as Slice[];

  if (isBucketsShape(json)) {
    const b = json.buckets;
    return [
      { name: "High value", value: Number(b.high ?? 0) },
      { name: "Mid value", value: Number(b.mid ?? 0) },
      { name: "Low value", value: Number(b.low ?? 0) },
    ];
  }

  if (isSegmentsArray(json)) {
    return json.segments as Slice[];
  }

  if (isSegmentsMap(json)) {
    return Object.entries(json.segments).map(([name, value]) => ({
      name,
      value: Number(value),
    }));
  }

  if (isPlainMap(json)) {
    return Object.entries(json).map(([name, value]) => ({
      name,
      value: Number(value ?? 0),
    }));
  }

  return null;
}

export default function SegmentsCard() {
  const [data, setData] = useState<Slice[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setErr(null);
    setLoading(true);
    setData(null);

    try {
      const r = await fetch("/api/insights/segments", { signal: ac.signal, cache: "no-store" });
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        console.error("segments fetch failed:", r.status, body);
        throw new Error(`HTTP ${r.status}`);
      }
      const json: ApiShape = await r.json();
      const slices = toSlices(json);
      if (!slices) throw new Error("Unexpected segments response shape");

      // If everything sums to zero, pass an empty array to show the "No segment data" state.
      const total = slices.reduce((s, d) => s + (Number(d.value) || 0), 0);
      setData(total > 0 ? slices : []);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  if (loading && !data && !err) {
    return (
      <Card withBorder radius="md" p="md">
        <Center style={{ height: 240 }}>
          <Loader />
        </Center>
      </Card>
    );
  }

  if (err) {
    return (
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" align="center">
          <Text c="red">Failed to load segments</Text>
          <Button size="xs" variant="light" onClick={load}>
            Retry
          </Button>
        </Group>
      </Card>
    );
  }

  return <SegmentsPie data={data ?? []} />;
}