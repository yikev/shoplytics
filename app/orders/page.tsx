// app/orders/page.tsx  (SERVER COMPONENT — no "use client")
import { Suspense } from "react";
import { Paper, Skeleton } from "@mantine/core";
import OrdersClient from "./OrdersClient";

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <Paper withBorder radius="md" p="md">
            <Skeleton height={22} mb="xs" />
            <Skeleton height={22} mb="xs" />
            <Skeleton height={22} mb="xs" />
            <Skeleton height={22} mb="xs" />
          </Paper>
        </div>
      }
    >
      <OrdersClient />
    </Suspense>
  );
}