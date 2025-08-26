// app/customers/page.tsx
"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Paper, Title, Table, Group, Button, Select, Text, TextInput, Skeleton, Badge
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

type Row = {
  id: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
};
type SortKey = "totalSpent" | "ordersCount" | "createdAt";
type Dir = "asc" | "desc";

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading customers…</div>}>
      <CustomersPageInner />
    </Suspense>
  );
}

function CustomersPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const segment = useMemo(() => {
    const s = (searchParams.get("segment") || "").toLowerCase();
    return s === "high" || s === "mid" || s === "low" ? s : undefined;
  }, [searchParams]);

  const [data, setData] = useState<{ total: number; page: number; pageSize: number; items: Row[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortKey>("totalSpent");
  const [dir, setDir] = useState<Dir>("desc");
  const [q, setQ] = useState("");

  const pageSize = 20;

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setData(null);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort,
      dir,
      q,
    });
    if (segment) params.set("segment", segment);

    fetch(`/api/customers/list?${params.toString()}`, {
      signal: ac.signal,
      cache: "no-store",
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [page, sort, dir, q, segment]);

  const total = data?.total ?? 0;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Group>
          <Title order={2}>Customers</Title>
          {segment && (
            <Badge variant="light">
              Filter: {segment}
              <Button
                size="compact-xs"
                variant="subtle"
                ml="xs"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete("segment");
                  router.push(url.toString());
                }}
              >
                clear
              </Button>
            </Badge>
          )}
        </Group>

        <Group wrap="nowrap">
          <TextInput
            value={q}
            onChange={(e) => { setQ(e.currentTarget.value); setPage(1); }}
            placeholder="Search by email…"
            leftSection={<IconSearch size={16} />}
          />
          <Select
            value={sort}
            onChange={(v) => setSort((v as SortKey) ?? "totalSpent")}
            data={[
              { value: "totalSpent", label: "Sort: Total Spent" },
              { value: "ordersCount", label: "Sort: Orders" },
              { value: "createdAt", label: "Sort: Newest" },
            ]}
          />
          <Select
            value={dir}
            onChange={(v) => setDir((v as Dir) ?? "desc")}
            data={[
              { value: "desc", label: "↓ Desc" },
              { value: "asc", label: "↑ Asc" },
            ]}
          />
        </Group>
      </Group>

      <Paper withBorder radius="md" p="md">
        {loading ? (
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
                <Table.Th>Email</Table.Th>
                <Table.Th>Orders</Table.Th>
                <Table.Th>Total Spent</Table.Th>
                <Table.Th>Customer Since</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data?.items.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.email}</Table.Td>
                  <Table.Td>{r.ordersCount}</Table.Td>
                  <Table.Td>${r.totalSpent.toFixed(2)}</Table.Td>
                  <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        <Group justify="space-between" mt="md">
          <Text size="sm" c="dimmed">
            {data ? `Showing ${start}-${end} of ${total}` : "—"}
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