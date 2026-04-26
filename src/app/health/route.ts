import { NextResponse } from "next/server";

/** Comprobación para Render y monitoreo: GET /health */
export function GET() {
  return NextResponse.json({ ok: true, t: new Date().toISOString() });
}
