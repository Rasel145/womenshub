import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { cancelStalePendingOrders, CANCEL_AFTER_HOURS } from "@/lib/order-expiry";

// Only the server's scheduler knows the secret, so only it can run this
function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Without a long secret this address stays closed for everyone
  if (!secret || secret.length < 24) return false;

  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);

  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }

  const cancelled = await cancelStalePendingOrders(CANCEL_AFTER_HOURS);
  return NextResponse.json({ cancelled });
}