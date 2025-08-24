"use client";

import { SessionProvider } from "next-auth/react";
import { MantineProvider } from "@mantine/core";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MantineProvider>{children}</MantineProvider>
    </SessionProvider>
  );
}