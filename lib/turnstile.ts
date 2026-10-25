const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cloudflare's test secrets. They accept anything, so they must never run on the live site.
const TEST_SECRETS = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

type Result = { ok: true } | { ok: false; error: string };

// Checks the token from the browser with Cloudflare. Every failure blocks the request.
export async function verifyTurnstile(token: unknown): Promise<Result> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not set");
    return { ok: false, error: "The security check is not set up. Please contact the store." };
  }

  if (process.env.NODE_ENV === "production" && TEST_SECRETS.has(secret)) {
    console.error("A Turnstile TEST secret is being used in production. Refusing.");
    return { ok: false, error: "The security check is not set up. Please contact the store." };
  }

  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return { ok: false, error: "Please complete the security check." };
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success === true) return { ok: true };

    console.warn("Turnstile check failed:", data["error-codes"]);
    return { ok: false, error: "The security check failed. Please try again." };
  } catch (e) {
    // If Cloudflare cannot be reached, the order is not accepted
    console.error("Turnstile verification error:", e);
    return {
      ok: false,
      error: "Could not complete the security check. Please try again.",
    };
  }
}