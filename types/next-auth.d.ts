import NextAuth, { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      role?: "ADMIN" | "MANAGER" | "VIEWER";
      tenant_id?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: "ADMIN" | "MANAGER" | "VIEWER";
    tenant_id?: string;
  }
}