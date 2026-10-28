// Checks the settings of the LIVE site. Returns a list of problems (empty = all good).
export function checkProductionEnv(): string[] {
  const problems: string[] = [];

  // Database
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    problems.push("DATABASE_URL is not set.");
  } else {
    try {
      const url = new URL(dbUrl);
      const password = decodeURIComponent(url.password);

      if (["postgres", "root", "admin"].includes(url.username))
        problems.push(
          "The website connects to the database as a superuser. Use a limited user."
        );
      if (password.length < 16)
        problems.push("The database password is too short (use at least 16 characters).");
    } catch {
      problems.push("DATABASE_URL is not a valid address.");
    }
  }

  // Scheduler secret
  if (!process.env.CRON_SECRET || process.env.CRON_SECRET.length < 32)
    problems.push("CRON_SECRET is missing or shorter than 32 characters.");

  // Captcha: must be real keys, not Cloudflare's test keys
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!siteKey) problems.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set.");
  else if (/^[123]x0+(AA|AB|BB|FF)$/.test(siteKey))
    problems.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY is a test key.");

  if (!secret) problems.push("TURNSTILE_SECRET_KEY is not set.");
  else if (/^[123]x0+AA$/.test(secret))
    problems.push("TURNSTILE_SECRET_KEY is a test key.");

  return problems;
}

export function assertProductionEnv() {
  // Only for trying a production build on your own computer
  if (process.env.SKIP_ENV_CHECK === "1") {
    console.warn("WARNING: SKIP_ENV_CHECK is on, the settings check is skipped.");
    return;
  }

  const problems = checkProductionEnv();
  if (problems.length > 0) {
    throw new Error(
      "The server cannot start. Fix these problems first:\n- " + problems.join("\n- ")
    );
  }
}