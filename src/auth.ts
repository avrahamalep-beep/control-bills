import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { ensureUserDefaults } from "@/lib/user-setup";
import { authConfig } from "./auth.config";

if (!process.env.AUTH_GOOGLE_ID && !process.env.GOOGLE_CLIENT_ID) {
  console.error(
    "[auth] Faltan credenciales OAuth: AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET (o GOOGLE_CLIENT_*) en .env"
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as import("next-auth").NextAuthConfig["adapter"],
  events: {
    async createUser({ user }) {
      if (user.id) await ensureUserDefaults(user.id);
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: { id: string; email?: string | null; name?: string | null; image?: string | null };
  }
}
