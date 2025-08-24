"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, TextInput, PasswordInput, Paper, Title, Stack, Text } from "@mantine/core";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@shoplytics.app");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) router.push("/dashboard");
    else setErr("Invalid credentials for demo");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Paper withBorder shadow="sm" p="lg" radius="md" style={{ width: 360 }}>
        <Title order={3} mb="md">Demo Login</Title>
        <form onSubmit={onSubmit}>
          <Stack>
            <TextInput label="Email" value={email} onChange={(e)=>setEmail(e.currentTarget.value)} />
            <PasswordInput label="Password" value={password} onChange={(e)=>setPassword(e.currentTarget.value)} />
            {err && <Text c="red" size="sm">{err}</Text>}
            <Button type="submit" loading={loading}>Sign in</Button>
            <Text size="xs" c="dimmed">Use demo@shoplytics.app / demo123</Text>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}