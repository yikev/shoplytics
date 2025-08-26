"use client";

import { useEffect, useState } from "react";
import {
  Paper, Title, Table, Group, TextInput, Select, Text, Badge, Skeleton
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

type Row = {
  id: string;
  title: string;
  sku: string;
  price: number;
  cost: number;
  inventory: number;
  createdAt: string;
  units: number;
  revenue: number;
  margin: number;
};

type SortKey = "revenue" | "units" | "margin" | "inventory" | "createdAt";
type Dir = "asc" | "desc";

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("revenue");
  const [dir, setDir] = useState<Dir>("desc");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setRows(null);
    const params = new URLSearchParams({
      q, sort, dir, limit: "20",
    });
    fetch(`/api/products/top?${params.toString()}`, { signal: ac.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRows(d.items))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [q, sort, dir]);

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
                <Table.Th>Product</Table.Th>
                <Table.Th>SKU</Table.Th>
                <Table.Th ta="right">Units</Table.Th>
                <Table.Th ta="right">Revenue</Table.Th>
                <Table.Th ta="right">Margin</Table.Th>
                <Table.Th ta="right">Inventory</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    <Text fw={600}>{r.title}</Text>
                    <Text size="xs" c="dimmed">
                      ${r.price.toFixed(2)} cost ${r.cost.toFixed(2)}
                    </Text>
                  </Table.Td>
                  <Table.Td>{r.sku}</Table.Td>
                  <Table.Td ta="right">{r.units.toLocaleString()}</Table.Td>
                  <Table.Td ta="right">${r.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Table.Td>
                  <Table.Td ta="right">
                    <Text c={r.margin >= 0 ? undefined : "red"}>
                      ${r.margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    {r.inventory <= 5 ? (
                      <Badge color="red" variant="light">{r.inventory}</Badge>
                    ) : r.inventory <= 20 ? (
                      <Badge color="yellow" variant="light">{r.inventory}</Badge>
                    ) : (
                      <Badge variant="light">{r.inventory}</Badge>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </div>
  );
}