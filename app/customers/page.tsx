"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Paper, Title, Table, Group, Button, Select, Text, TextInput, Skeleton, Badge, Alert, Center
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

type Row = {
  id: string;
  email: string;
  ordersCount: number;
  totalSpent: number;   // API now returns a number
  createdAt: string;
};
type SortKey = "totalSpent" | "ordersCount" | "createdAt";
type Dir = "asc" | "desc";

const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // --- read initial state from URL ---
  const initialSegment = useMemo(() => {
    const s = (searchParams.get("segment") || "").toLowerCase();
    return s === "high" || s === "mid" || s === "low" ? s : undefined;
  }, [searchParams]);

  const initialSort = ((searchParams.get("sort") as SortKey) || "totalSpent") as SortKey;
  const initialDir = ((searchParams.get("dir") as Dir) || "desc") as Dir;
  const initialPage = Math.max(1, Number(searchParams.get("page") || "1"));
  const initialQ = searchParams.get("q") || "";

  // --- state ---
  const [segment] = useState<"high" | "mid" | "low" | undefined>(initialSegment);
  const [page, setPage] = useState(initialPage);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [dir, setDir] = useState<Dir>(initialDir);
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);

  const [data, setData] = useState<{ total: number; page: number; pageSize: number; items: Row[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pageSize = 20;

  // --- debounce search ---
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setDebouncedQ(q), 300);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [q]);

  // --- keep URL in sync (no navigation) ---
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    url.searchParams.set("sort", sort);
    url.searchParams.set("dir", dir);
    if (debouncedQ) url.searchParams.set("q", debouncedQ);
    else url.searchParams.delete("q");
    if (segment) url.searchParams.set("segment", segment);
    else url.searchParams.delete("segment");
    window.history.replaceState({}, "", url.toString());
  }, [page, sort, dir, debouncedQ, segment]);

  // --- load data ---
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setErr(null);
    setData(null);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort,
      dir,
      q: debouncedQ,
    });
    if (segment) params.set("segment", segment);

    fetch(`/api/customers/list?${params.toString()}`, {
      signal: ac.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then(setData)
      .catch((e) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) setErr(String(e));
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [page, sort, dir, debouncedQ, segment]);

  // --- derived ---
  const total = data?.total ?? 0;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // --- helpers ---
  const clearSegment = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("segment");
    router.push(`${pathname}?${url.searchParams.toString()}`);
  };

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Title order={2}>Customers</Title>
          {segment && (
            <Badge variant="light" radius="sm">
              Filter: {segment}
              <Button
                size="compact-xs"
                variant="subtle"
                ml="xs"
                onClick={clearSegment}
                aria-label="Clear segment filter"
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
            onChange={(v) => { setSort((v as SortKey) ?? "totalSpent"); setPage(1); }}
            data={[
              { value: "totalSpent", label: "Sort: Total Spent" },
              { value: "ordersCount", label: "Sort: Orders" },
              { value: "createdAt", label: "Sort: Newest" },
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

      {err && (
        <Alert color="red" mb="md" title="Failed to load customers">
          {err}
        </Alert>
      )}

      <Paper withBorder radius="md" p="md">
        {loading || !data ? (
          <>
            <Skeleton height={22} mb="xs" />
            <Skeleton height={22} mb="xs" />
            <Skeleton height={22} mb="xs" />
            <Skeleton height={22} mb="xs" />
          </>
        ) : data.items.length === 0 ? (
          <Center style={{ height: 120 }}>
            <Text c="dimmed">No customers found.</Text>
          </Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Email</Table.Th>
                <Table.Th>Orders</Table.Th>
                <Table.Th ta="right">Total Spent</Table.Th>
                <Table.Th>Customer Since</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.items.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.email}</Table.Td>
                  <Table.Td>{r.ordersCount}</Table.Td>
                  <Table.Td ta="right">{currency.format(Number(r.totalSpent) || 0)}</Table.Td>
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