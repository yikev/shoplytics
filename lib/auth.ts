import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

type Role = "ADMIN" | "MANAGER" | "VIEWER";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Demo Login",
      credentials: { email: { label: "Email" }, password: { label: "Password" } },
      async authorize(creds) {
        if (creds?.email === "demo@shoplytics.app" && creds?.password === "demo123") {
          return { id: "user_demo", email: "demo@shoplytics.app", role: "ADMIN" as Role, tenant_id: "tenant_demo" };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && typeof user === "object") {
        const u = user as User & { role?: Role; tenant_id?: string };
        if (u.role) token.role = u.role;
        if (u.tenant_id) token.tenant_id = u.tenant_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as Role | undefined) ?? session.user.role;
        session.user.tenant_id = (token.tenant_id as string | undefined) ?? session.user.tenant_id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};