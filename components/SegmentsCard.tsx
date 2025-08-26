"use client";

import { useEffect, useState } from "react";
import { Card, Center, Loader, Text } from "@mantine/core";
import SegmentsPie, { Slice } from "@/components/SegmentsPie";

type ApiBuckets = { low?: number; mid?: number; high?: number };
type ApiShape =
  | { buckets?: ApiBuckets }
  | { segments?: Slice[] }
  | Slice[];

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

        const json: ApiShape = await r.json();
        let slices: Slice[] | null = null;

        if (Array.isArray(json)) {
          // already an array of {name,value}
          slices = json as Slice[];
        } else if ("buckets" in json && json.buckets) {
          const b = json.buckets;
          slices = [
            { name: "High value", value: Number(b.high ?? 0) },
            { name: "Mid value", value: Number(b.mid ?? 0) },
            { name: "Low value", value: Number(b.low ?? 0) },
          ];
        } else if ("segments" in json && Array.isArray(json.segments)) {
          slices = json.segments as Slice[];
        }

        if (!slices) throw new Error("Unexpected segments response shape");
        setData(slices);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(String(e?.message ?? e));
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