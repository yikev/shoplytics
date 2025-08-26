"use client";

import { useEffect, useState } from "react";
import { Card, Group, Text, Table, Badge, Skeleton, Button } from "@mantine/core";
import Link from "next/link";

type OrderStatus = "PENDING" | "PAID" | "CANCELLED";

type Row = {
  id: string;
  createdAt: string; // ISO string
  status: OrderStatus;
  total: number;
  email: string;
};

// Shape we expect from the API; fields can be missing, so all optional
type ApiItem = {
  id?: unknown;
  createdAt?: unknown;
  status?: unknown;
  total?: unknown;
  email?: unknown;
};
type ApiResp = { items?: ApiItem[] };

const statusColor = (s: OrderStatus) =>
  s === "PAID" ? "green" : s === "CANCELLED" ? "red" : "yellow";

function normalizeStatus(v: unknown): OrderStatus {
  const s = String(v ?? "").toUpperCase();
  return s === "PAID" || s === "PENDING" || s === "CANCELLED" ? (s as OrderStatus) : "PENDING";
}

export default function RecentOrders({ limit = 10 }: { limit?: number }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setErr(null);
    setRows(null);

    fetch(`/api/orders/recent?limit=${limit}`, { signal: ac.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((json: ApiResp) => {
        const items = (json.items ?? []).map<Row>((i) => ({
          id: String(i.id ?? ""),
          email: String(i.email ?? "—"),
          status: normalizeStatus(i.status),
          total: Number(i.total ?? 0),
          createdAt: String(i.createdAt ?? new Date().toISOString()),
        }));
        setRows(items);
      })
      .catch((e) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) setErr(String(e));
      });

    return () => ac.abort();
  }, [limit]);

  return (
    <Card withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <Text fw={700}>Recent Orders</Text>
        <Button component={Link} href="/orders" size="xs" variant="light">
          View all
        </Button>
      </Group>

      {err && <Text c="red">Failed to load: {err}</Text>}

      {!rows && !err && (
        <>
          <Skeleton height={22} mb="xs" />
          <Skeleton height={22} mb="xs" />
          <Skeleton height={22} mb="xs" />
        </>
      )}

      {rows && rows.length === 0 && <Text c="dimmed">No recent orders</Text>}

      {rows && rows.length > 0 && (
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
                <Table.Td>{r.email}</Table.Td>
                <Table.Td>
                  <Badge variant="light" size="sm" color={statusColor(r.status)}>
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
    </Card>
  );
}