import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const HEADERS = { "Cache-Control": "no-store" };

// Only the owner can call this: it needs the CRON_SECRET
function authorized(request: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) return false;

  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request))
    return NextResponse.json({ error: "Not allowed." }, { status: 401, headers: HEADERS });

  try {
    const [products, users] = await Promise.all([prisma.product.count(), prisma.user.count()]);
    return NextResponse.json({ ok: true, products, users }, { headers: HEADERS });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    const reason = (err.message ?? String(e)).split("\n").filter(Boolean).slice(-3).join(" ");
    return NextResponse.json(
      { ok: false, code: err.code ?? null, reason: reason.slice(0, 400) },
      { status: 500, headers: HEADERS }
    );
  }
}