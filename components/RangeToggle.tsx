"use client";
import { SegmentedControl } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";

export default function RangeToggle() {
  const router = useRouter();
  const sp = useSearchParams();
  const value = (sp.get("range") === "90d" ? "90d" : "30d") as "30d"|"90d";

  return (
    <SegmentedControl
      value={value}
      onChange={(v) => {
        const params = new URLSearchParams(sp.toString());
        params.set("range", v);
        // For simplicity, clear explicit from/to when switching preset
        params.delete("from"); params.delete("to");
        router.replace(`?${params.toString()}`);
      }}
      data={[
        { label: "30d", value: "30d" },
        { label: "90d", value: "90d" },
      ]}
      size="xs"
    />
  );
}