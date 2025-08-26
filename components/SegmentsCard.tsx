"use client";

import { useEffect, useState } from "react";
import { Card, Center, Loader, Text } from "@mantine/core";
import SegmentsPie, { Slice } from "@/components/SegmentsPie";

type ApiBuckets = { low?: number; mid?: number; high?: number };
type ApiShape =
  | { buckets?: ApiBuckets }
  | { segments?: Slice[] }
  | Slice[];

// Type guards to avoid `any`
function isSliceArray(v: unknown): v is Slice[] {
  return Array.isArray(v) && v.every(
    (x) => x && typeof x === "object" && "name" in x && "value" in x
  );
}
function hasBuckets(v: unknown): v is { buckets: ApiBuckets } {
  return !!v && typeof v === "object" && "buckets" in (v as Record<string, unknown>);
}
function hasSegments(v: unknown): v is { segments: Slice[] } {
  return !!v && typeof v === "object" && "segments" in (v as Record<string, unknown>);
}

export default function SegmentsCard() {
  const [data, setData] = useState<Slice[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setErr(null);
        setData(null);

        const r = await fetch("/api/insights/segments", {
          signal: ac.signal,
          cache: "no-store",
        });

        if (!r.ok) {
          const body = await r.text().catch(() => "");
          console.error("segments fetch failed:", r.status, body);
          throw new Error(`HTTP ${r.status}`);
        }

        const json: unknown = await r.json();

        let slices: Slice[] | null = null;

        if (isSliceArray(json)) {
          slices = json;
        } else if (hasSegments(json) && isSliceArray(json.segments)) {
          slices = json.segments;
        } else if (hasBuckets(json) && json.buckets) {
          const b = json.buckets;
          const toNum = (n: unknown) => Number(n ?? 0);
          slices = [
            { name: "High value", value: toNum(b.high) },
            { name: "Mid value", value: toNum(b.mid) },
            { name: "Low value", value: toNum(b.low) },
          ];
        }

        if (!slices) throw new Error("Unexpected segments response shape");
        setData(slices);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setErr(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => ac.abort();
  }, []);

  if (err) {
    return (
      <Card withBorder radius="md" p="md">
        <Text c="red">Failed to load segments</Text>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card withBorder radius="md" p="md">
        <Center style={{ height: 240 }}>
          <Loader />
        </Center>
      </Card>
    );
  }

  return <SegmentsPie data={data} />;
}