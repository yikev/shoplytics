// app/orders/[id]/StatusChanger.tsx
"use client";
import { useState, useTransition } from "react";
import { Group, Badge, Select, Button } from "@mantine/core";

export default function StatusChanger({
  id, status,
}: { id: string; status: "PENDING" | "PAID" | "CANCELLED" }) {
  const [value, setValue] = useState(status);
  const [isPending, start] = useTransition();

  const color = value === "PAID" ? "green" : value === "PENDING" ? "yellow" : "red";

  return (
    <Group>
      <Badge color={color} variant="light">{value}</Badge>
      <Select
        value={value}
        onChange={(v) => v && setValue(v as any)}
        data={[
          { value: "PENDING", label: "PENDING" },
          { value: "PAID", label: "PAID" },
          { value: "CANCELLED", label: "CANCELLED" },
        ]}
      />
      <Button
        size="xs"
        disabled={isPending}
        onClick={() =>
          start(async () => {
            const r = await fetch(`/api/orders/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: value }),
            });
            if (!r.ok) alert("Failed to update status");
          })
        }
      >
        {isPending ? "Saving…" : "Save"}
      </Button>
    </Group>
  );
}