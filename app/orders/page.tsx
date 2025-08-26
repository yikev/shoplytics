// app/orders/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Paper, Title, Table, Group, TextInput, Select, Text, Badge, Skeleton, Button,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

type Row = {
  id: string;
  customerEmail: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  total: number;
  createdAt: string; // ISO
};

type SortKey = "createdAt" | "total" | "status";
type Dir = "asc" | "desc";

const STATUSES = ["PENDING", "PAID", "CANCELLED"] as const;

export default function OrdersPage() {
  const sp = useSearchParams();

  // --- read initial filters from URL
  const initial = useMemo(() => {
    const q = sp.get("q") ?? "";
    const sort = (sp.get("sort") as SortKey) || "createdAt";

    // ✅ ensure Dir type, not a generic string
    const dir: Dir = sp.get("dir") === "asc" ? "asc" : "desc";

    const page = Number(sp.get("page") ?? "1") || 1;
    const statusParam = sp.get("status") ?? "";
    const status = (STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as Row["status"])
      : undefined;
    const from = sp.get("from") ?? "";
    const to = sp.get("to") ?? "";
    return { q, sort, dir, page, status, from, to };
  }, [sp]);

  const [q, setQ] = useState(initial.q);
  const [sort, setSort] = useState<SortKey>(initial.sort);
  const [dir, setDir] = useState<Dir>(initial.dir);
  const [page, setPage] = useState(initial.page);
  const [status, setStatus] = useState<Row["status"] | undefined>(initial.status);
  const [from, setFrom] = useState(initial.from); // YYYY-MM-DD
  const [to, setTo] = useState(initial.to);

  const pageSize = 20;

  const [rows, setRows] = useState<Row[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // keep URL in sync (cheap replaceState)
  useEffect(() => {
    const url = new URL(window.location.href);
    const set = (k: string, v?: string) => {
      if (v && v.length) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    };

    set("q", q);
    set("sort", sort);
    set("dir", dir);
    set("page", String(page));
    set("status", status ?? "");
    set("from", from);
    set("to", to);
    window.history.replaceState({}, "", url.toString());
  }, [q, sort, dir, page, status, from, to]);

  // fetch
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
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    fetch(`/api/orders/list?${params.toString()}`, { signal: ac.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setRows(d.items ?? []);
        setTotal(d.total ?? 0);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [q, sort, dir, page, status, from, to]);

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const statusColor = (s: Row["status"]) =>
    s === "PAID" ? "green" : s === "CANCELLED" ? "red" : "yellow";

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md" align="end">
        <Title order={2}>Orders</Title>

        <Group wrap="wrap" gap="xs">
          <TextInput
            value={q}
            onChange={(e) => { setQ(e.currentTarget.value); setPage(1); }}
            placeholder="Search order id or customer email…"
            leftSection={<IconSearch size={16} />}
          />

          <Select
            value={status ?? ""}
            onChange={(v) => { setStatus((v as Row["status"]) || undefined); setPage(1); }}
            data={[{ value: "", label: "All statuses" }, ...STATUSES.map(s => ({ value: s, label: s }))]}
            placeholder="Status"
            allowDeselect
          />

          <TextInput
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.currentTarget.value); setPage(1); }}
            placeholder="From"
          />
          <TextInput
            type="date"
            value={to}
            onChange={(e) => { setTo(e.currentTarget.value); setPage(1); }}
            placeholder="To"
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
                    <Link href={`/orders/${r.id}`}>
                      <Text fw={600}>#{r.id}</Text>
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