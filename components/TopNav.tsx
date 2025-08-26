// components/TopNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Group, Button, Anchor, Text } from "@mantine/core";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/customers", label: "Customers" },
  { href: "/insights", label: "Insights" },
  { href: "/orders", label: "Orders" },
  { href: "/settings", label: "Settings" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tenant = session?.user?.tenant_id ?? "tenant_demo";

  return (
    <div className="w-full border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <Group justify="space-between">
          <Group gap="md">
            <Text fw={700}>Shoplytics</Text>
            {links.map((l) => (
              <Anchor
                key={l.href}
                component={Link}
                href={l.href}
                underline="never"
                c={pathname?.startsWith(l.href) ? "blue" : "dark"}
                style={{ fontWeight: pathname?.startsWith(l.href) ? 700 : 400 }}
              >
                {l.label}
              </Anchor>
            ))}
          </Group>
          <Group gap="sm">
            <Text size="sm" c="dimmed">{tenant}</Text>
            <Button size="xs" variant="light" onClick={() => signOut({ callbackUrl: "/login" })}>
              Sign out
            </Button>
          </Group>
        </Group>
      </div>
    </div>
  );
}