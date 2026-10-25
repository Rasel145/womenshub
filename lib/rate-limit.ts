import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type Limit = { key: string; limit: number; windowSeconds: number };
export type RateResult = { allowed: boolean; retryAfterSeconds: number };

// Phone numbers, emails and IPs are stored only as hashes in the RateLimit table
export function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

// The visitor's IP address.
// These headers are only trustworthy when the server can be reached ONLY through
// your reverse proxy (Cloudflare / Nginx), which sets them. We set that up when deploying.
export async function getClientIp() {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// Counts one attempt for this key. The whole update is ONE database statement,
// so many requests at the same moment cannot slip past the limit.
async function hit({ key, limit, windowSeconds }: Limit): Promise<RateResult> {
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;

  const rows = await prisma.$queryRaw<{ count: number; resetAt: bigint }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt}::bigint)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."resetAt" <= ${now}::bigint THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimit"."resetAt" <= ${now}::bigint THEN ${resetAt}::bigint
        ELSE "RateLimit"."resetAt"
      END
    RETURNING "count", "resetAt"
  `;

  // Now and then, remove windows that have already ended
  if (Math.random() < 0.01) {
    await prisma.rateLimit
      .deleteMany({ where: { resetAt: { lt: BigInt(now) } } })
      .catch(() => {});
  }

  const row = rows[0];
  return {
    allowed: Number(row.count) <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((Number(row.resetAt) - now) / 1000)),
  };
}

// Checks several limits at once. If any of them is full, the request is not allowed.
export async function checkLimits(limits: Limit[]): Promise<RateResult> {
  let result: RateResult = { allowed: true, retryAfterSeconds: 0 };

  for (const l of limits) {
    const r = await hit(l);
    if (!r.allowed && r.retryAfterSeconds > result.retryAfterSeconds) result = r;
  }
  return result;
}

// Forget the count for a key, e.g. after a correct password
export async function resetLimit(key: string) {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

export function tooManyMessage(retryAfterSeconds: number) {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return minutes <= 1
    ? "Too many attempts. Please try again in a minute."
    : `Too many attempts. Please try again in ${minutes} minutes.`;
}