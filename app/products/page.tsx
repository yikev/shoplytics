"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Paper, Title, Table, Group, TextInput, Select, Text, Badge, Skeleton, Tooltip
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

type Row = {
  id: string;
  title: string;
  sku?: string | null;
  price?: number | null;
  cost?: number | null;
  inventory?: number | null;
  createdAt?: string | null;
  units: number;
  revenue: number;
  margin: number;
  deltaRevenuePct?: number | null;
  deltaUnitsPct?: number | null;
};

type SortKey = "revenue" | "units" | "margin" | "inventory" | "createdAt";
type Dir = "asc" | "desc";

// little helper for +/- badges
function Delta({ value }: { value: number | null | undefined }) {
  if (value == null || !isFinite(value)) return null;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const color = value > 0 ? "green" : value < 0 ? "red" : "gray";
  return (
    <Badge size="sm" color={color} variant="light" ml="xs">
      {sign}{Math.abs(value).toFixed(0)}%
    </Badge>
  );
}

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("revenue");
  const [dir, setDir] = useState<Dir>("desc");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);

  // simple debounce so we don’t fetch on every keystroke
  const debouncedQ = useMemo(() => q, [q]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setRows(null);
    const params = new URLSearchParams({
      q: debouncedQ,
      sort,
      dir,
      limit: "20",
      range: "30d", // or "90d" if you wire a toggle
    });
    fetch(`/api/products/top?${params.toString()}`, { signal: ac.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((d) => setRows(d?.items ?? []))
      .catch((e) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.error("products fetch failed:", e);
          setRows([]);
        }
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [debouncedQ, sort, dir]);

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Title order={2}>Products</Title>
        <Group wrap="nowrap">
          <TextInput
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            placeholder="Search by title or SKU…"
            leftSection={<IconSearch size={16} />}
          />
          <Select
            value={sort}
            onChange={(v) => setSort((v as SortKey) ?? "revenue")}
            data={[
              { value: "revenue", label: "Sort: Revenue" },
              { value: "units", label: "Sort: Units" },
              { value: "margin", label: "Sort: Margin" },
              { value: "inventory", label: "Sort: Inventory" },
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
        {loading || rows == null ? (
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
                <Table.Th>Product</Table.Th>
                <Table.Th>SKU</Table.Th>
                <Table.Th ta="right">Units</Table.Th>
                <Table.Th ta="right">Revenue</Table.Th>
                <Table.Th ta="right">Margin</Table.Th>
                <Table.Th ta="right">Inventory</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => {
                const price = r.price ?? 0;
                const cost = r.cost ?? 0;
                const inv = r.inventory ?? 0;
                return (
                  <Table.Tr key={r.id}>
                    <Table.Td>
                      <Text fw={600}>{r.title}</Text>
                      <Text size="xs" c="dimmed">
                        ${price.toFixed(2)} cost ${cost.toFixed(2)}
                      </Text>
                    </Table.Td>
                    <Table.Td>{r.sku ?? "—"}</Table.Td>

                    <Table.Td ta="right">
                      <Group justify="flex-end" gap="xs" wrap="nowrap">
                        <Text>{r.units.toLocaleString()}</Text>
                        <Tooltip label="Change vs previous period">
                          <div><Delta value={r.deltaUnitsPct} /></div>
                        </Tooltip>
                      </Group>
                    </Table.Td>

                    <Table.Td ta="right">
                      <Group justify="flex-end" gap="xs" wrap="nowrap">
                        <Text>
                          ${r.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </Text>
                        <Tooltip label="Change vs previous period">
                          <div><Delta value={r.deltaRevenuePct} /></div>
                        </Tooltip>
                      </Group>
                    </Table.Td>

                    <Table.Td ta="right">
                      <Text c={r.margin >= 0 ? undefined : "red"}>
                        ${r.margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Text>
                    </Table.Td>

                    <Table.Td ta="right">
                      {inv <= 5 ? (
                        <Badge color="red" variant="light">{inv}</Badge>
                      ) : inv <= 20 ? (
                        <Badge color="yellow" variant="light">{inv}</Badge>
                      ) : (
                        <Badge variant="light">{inv}</Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </div>
  );
}