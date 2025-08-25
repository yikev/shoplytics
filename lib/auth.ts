// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Demo Login",
      credentials: { email: { label: "Email" }, password: { label: "Password" } },
      async authorize(creds) {
        if (creds?.email === "demo@shoplytics.app" && creds?.password === "demo123") {
          return {
            id: "user_demo",
            email: "demo@shoplytics.app",
            role: "ADMIN" as const,
            tenant_id: "tenant_demo",
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.role = (user.role as "ADMIN" | "MANAGER" | "VIEWER" | undefined) ?? token.role;
        token.tenant_id = (user.tenant_id as string | undefined) ?? token.tenant_id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.role = (token.role as Session["user"]["role"]) ?? session.user.role;
        session.user.tenant_id = (token.tenant_id as string | undefined) ?? session.user.tenant_id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};