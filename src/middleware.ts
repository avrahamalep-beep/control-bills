import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

/**
 * Instancia sin Prisma — solo auth.config. El Edge no puede cargar @prisma/client.
 * Debe ser distinta de la de auth.ts (con adapter) pero con la misma config + JWT.
 */
const { auth: edgeAuth } = NextAuth(authConfig);

export default edgeAuth((req) => {
  const path = req.nextUrl.pathname;
  if (path === "/health" || path.startsWith("/_next") || path === "/favicon.ico" || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  if (path === "/login") {
    if (req.auth) return NextResponse.redirect(new URL("/", req.nextUrl));
    return NextResponse.next();
  }
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)"],
};
