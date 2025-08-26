// app/orders/[id]/StatusChanger.tsx
"use client";

import { useState, useTransition } from "react";
import { Group, Badge, Select, Button } from "@mantine/core";

type Status = "PENDING" | "PAID" | "CANCELLED";

export default function StatusChanger({
  id,
  status,
}: {
  id: string;
  status: Status;
}) {
  const [value, setValue] = useState<Status>(status);
  const [isPending, startTransition] = useTransition();

  const changed = value !== status;
  const color =
    value === "PAID" ? "green" : value === "CANCELLED" ? "red" : "yellow";

  return (
    <Group>
      <Badge color={color} variant="light">
        {value}
      </Badge>

      <Select
        value={value}
        onChange={(v) => {
          if (v) setValue(v as Status);
        }}
        data={[
          { value: "PENDING", label: "PENDING" },
          { value: "PAID", label: "PAID" },
          { value: "CANCELLED", label: "CANCELLED" },
        ]}
        allowDeselect={false}
        comboboxProps={{ withinPortal: true }}
      />

      <Button
        size="xs"
        disabled={isPending || !changed}
        onClick={() =>
          startTransition(async () => {
            const r = await fetch(`/api/orders/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: value }),
              cache: "no-store",
            });

            if (!r.ok) {
              setValue(status);
              alert("Failed to update status");
              return;
            }
          })
        }
      >
        {isPending ? "Saving…" : "Save"}
      </Button>
    </Group>
  );
}