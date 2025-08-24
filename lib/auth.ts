// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Demo Login",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (
          creds?.email === "demo@shoplytics.app" &&
          creds?.password === "demo123"
        ) {
          return {
            id: "user_demo",
            email: "demo@shoplytics.app",
            role: "ADMIN",
            tenant_id: "tenant_demo",
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // copy custom fields from user -> token on first sign in
        token.role = (user as any).role;
        token.tenant_id = (user as any).tenant_id;
      }
      return token;
    },
    async session({ session, token }) {
      // expose on session for client use
      (session.user as any).role = token.role;
      (session.user as any).tenant_id = token.tenant_id;
      return session;
    },
  },
  // optional: nicer default pages if you want
  // pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};