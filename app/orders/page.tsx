// app/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Paper, Title, Table, Group, TextInput, Select, Text, Badge, Skeleton, Button,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

type Status = "PENDING" | "PAID" | "CANCELLED";

type Row = {
  id: string;
  customerEmail: string;
  status: Status;
  total: number;
  createdAt: string; // ISO
};

type SortKey = "createdAt" | "total" | "status";
type Dir = "asc" | "desc";

export default function OrdersPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("createdAt");
  const [dir, setDir] = useState<Dir>("desc");
  const [status, setStatus] = useState<Status | "">(""); // filter (optional)
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [rows, setRows] = useState<Row[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setRows(null);

    const params = new URLSearchParams({
      q,
      sort,
      dir,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (status) params.set("status", status);

    fetch(`/api/orders/list?${params.toString()}`, { signal: ac.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setRows(d.items ?? []);
        setTotal(d.total ?? 0);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [q, sort, dir, page, status]);

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const statusColor = (s: Status) =>
    s === "PAID" ? "green" : s === "CANCELLED" ? "red" : "yellow";

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Title order={2}>Orders</Title>

        <Group wrap="nowrap">
          <TextInput
            value={q}
            onChange={(e) => { setQ(e.currentTarget.value); setPage(1); }}
            placeholder="Search order id or customer email…"
            leftSection={<IconSearch size={16} />}
          />
          <Select
            value={status}
            onChange={(v) => { setStatus((v as Status) ?? ""); setPage(1); }}
            placeholder="Filter: Status"
            clearable
            data={[
              { value: "PENDING", label: "PENDING" },
              { value: "PAID", label: "PAID" },
              { value: "CANCELLED", label: "CANCELLED" },
            ]}
          />
          <Select
            value={sort}
            onChange={(v) => { setSort((v as SortKey) ?? "createdAt"); setPage(1); }}
            data={[
              { value: "createdAt", label: "Sort: Newest" },
              { value: "total", label: "Sort: Total" },
              { value: "status", label: "Sort: Status" },
            ]}
          />
          <Select
            value={dir}
            onChange={(v) => { setDir((v as Dir) ?? "desc"); setPage(1); }}
            data={[
              { value: "desc", label: "↓ Desc" },
              { value: "asc", label: "↑ Asc" },
            ]}
          />
        </Group>
      </Group>

      <Paper withBorder radius="md" p="md">
        {loading || !rows ? (
          <>
            <Skeleton height={22} mb="xs" />
            <Skeleton height={22} mb="xs" />
            <Skeleton height={22} mb="xs" />
            <Skeleton height={22} mb="xs" />
          </>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Order</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
                <Table.Th>Placed</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    <Link href={`/orders/${r.id}`} className="font-medium">
                      #{r.id}
                    </Link>
                  </Table.Td>
                  <Table.Td>{r.customerEmail}</Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(r.status)} variant="light" size="sm">
                      {r.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right">
                    ${r.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Table.Td>
                  <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        <Group justify="space-between" mt="md">
          <Text size="sm" c="dimmed">
            {rows ? `Showing ${start}-${end} of ${total}` : "—"}
          </Text>
          <Group>
            <Button size="xs" variant="light" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <Button
              size="xs"
              variant="light"
              disabled={loading || page * pageSize >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </Group>
        </Group>
      </Paper>
    </div>
  );
}