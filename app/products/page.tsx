"use client";
import { useEffect, useState } from "react";
import { Table, Paper, Title } from "@mantine/core";

type Row = {
  id: string;
  title: string;
  sku: string | null;
  units: number;
  revenue: number;
  price: number;
  cost: number;
  inventory: number;
  marginPct: number;
};

export default function ProductsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products/top")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setRows)
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div className="p-6">
      <Title order={2} mb="md">Top Products</Title>
      <Paper withBorder radius="md" p="md">
        {err ? (
          <div style={{ padding: 12, color: "red" }}>Failed to load: {err}</div>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>SKU</Table.Th>
                <Table.Th>Units</Table.Th>
                <Table.Th>Revenue</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Margin %</Table.Th>
                <Table.Th>Inventory</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.title}</Table.Td>
                  <Table.Td>{r.sku ?? "—"}</Table.Td>
                  <Table.Td>{r.units}</Table.Td>
                  <Table.Td>${Number(r.revenue).toFixed(2)}</Table.Td>
                  <Table.Td>${Number(r.price).toFixed(2)}</Table.Td>
                  <Table.Td>{Number(r.marginPct).toFixed(1)}%</Table.Td>
                  <Table.Td>{r.inventory}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </div>
  );
}