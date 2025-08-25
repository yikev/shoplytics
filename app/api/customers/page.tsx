"use client";
import { useEffect, useState } from "react";
import { Paper, Title, Table, Group, Button, Select, Text } from "@mantine/core";

type Row = { id: string; email: string; ordersCount: number; totalSpent: number; createdAt: string };

export default function CustomersPage() {
  const [data, setData] = useState<{ total: number; page: number; pageSize: number; items: Row[] } | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("totalSpent");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const pageSize = 20;

  useEffect(() => {
    fetch(`/api/customers/list?page=${page}&pageSize=${pageSize}&sort=${sort}&dir=${dir}`)
      .then(r => r.json())
      .then(setData);
  }, [page, sort, dir]);

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Title order={2}>Customers</Title>
        <Group>
          <Select value={sort} onChange={(v)=>setSort(v || "totalSpent")}
            data={[
              { value: "totalSpent", label: "Sort: Total Spent" },
              { value: "ordersCount", label: "Sort: Orders" },
              { value: "createdAt", label: "Sort: Newest" },
            ]}/>
          <Select value={dir} onChange={(v)=>setDir((v as any) || "desc")}
            data={[{value:"desc",label:"↓ Desc"},{value:"asc",label:"↑ Asc"}]}/>
        </Group>
      </Group>

      <Paper withBorder radius="md" p="md">
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
        <Group justify="space-between" mt="md">
          <Text size="sm" c="dimmed">
            {data ? `Showing ${(data.page-1)*pageSize+1}-${Math.min(data.page*pageSize, data.total)} of ${data.total}` : "—"}
          </Text>
          <Group>
            <Button size="xs" variant="light" disabled={!data || page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
            <Button size="xs" variant="light" disabled={!data || page*pageSize>= (data?.total||0)} onClick={()=>setPage(p=>p+1)}>Next</Button>
          </Group>
        </Group>
      </Paper>
    </div>
  );
}