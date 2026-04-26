import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const allowed = () =>
  (process.env.ALLOWED_EMAILS ?? "")
    .split(/[,\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

/**
 * Config sin Prisma: sirve al middleware (Edge) y a auth.ts.
 * La sesión es JWT para no usar DB en el Edge.
 */
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  providers: [
    Google({
      clientId: googleId ?? "",
      clientSecret: googleSecret ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const e = user.email?.toLowerCase();
      if (!e) return false;
      const a = allowed();
      if (a.length === 0) return true;
      return a.includes(e);
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && (token as { id?: string }).id) {
        session.user.id = (token as { id: string }).id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
