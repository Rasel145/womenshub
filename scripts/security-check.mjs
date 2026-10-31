// Security smoke test for YOUR OWN website. It only sends normal web requests and reads the answers.
//
//   node scripts/security-check.mjs                    tests http://localhost:3000
//   node scripts/security-check.mjs https://your-site.com --i-own-this-site
//
// Optional: set CUSTOMER_COOKIE and ADMIN_COOKIE to the value of the "session" cookie of a
// logged-in customer and a logged-in admin, to also test what each of them can reach.

const args = process.argv.slice(2);
const BASE = (args.find((a) => a.startsWith("http")) ?? "http://localhost:3000").replace(/\/$/, "");
const host = new URL(BASE).hostname;
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);

if (!isLocal && !args.includes("--i-own-this-site")) {
  console.error("This script sends many requests. Run it only against a site you own.");
  console.error("Add --i-own-this-site to confirm.");
  process.exit(2);
}

const CUSTOMER = process.env.CUSTOMER_COOKIE;
const ADMIN = process.env.ADMIN_COOKIE;

// Words that only an admin page can contain
const ADMIN_MARKERS = [
  "Delivered revenue",
  "Pending orders",
  "Orders placed",
  "Best selling products",
  "Download Excel",
  "Recent orders",
  "Internal note",
  "Blocked numbers",
];

const REDIRECTS = [301, 302, 303, 307, 308];

async function request(path, { method = "GET", cookie, headers = {}, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    redirect: "manual",
    headers: { ...(cookie ? { cookie: `session=${cookie}` } : {}), ...headers },
    body,
    signal: AbortSignal.timeout(20000),
  });
  const text = (await res.text().catch(() => "")).slice(0, 300000);
  return { status: res.status, headers: res.headers, text };
}

const hasMarker = (text) => ADMIN_MARKERS.some((m) => text.includes(m));

// "Blocked" = redirected, refused, not found, or a page without any admin content
const isBlocked = (r) =>
  REDIRECTS.includes(r.status) ||
  [401, 403, 404].includes(r.status) ||
  (r.status === 200 && !hasMarker(r.text));

const results = [];
let group = "";

function section(name) {
  group = name;
  console.log(`\n${name}`);
}

async function check(name, fn) {
  let status;
  let note = "";

  try {
    const out = await fn();
    if (typeof out === "boolean") status = out ? "PASS" : "FAIL";
    else {
      status = out[0] ? "PASS" : out[2] === "WARN" ? "WARN" : "FAIL";
      note = out[1] ?? "";
    }
  } catch (e) {
    status = "FAIL";
    note = `request failed: ${e.message}`;
  }

  results.push({ group, name, status });
  console.log(`  ${status.padEnd(4)}  ${name}${note ? `  (${note})` : ""}`);
}

// ---------------------------------------------------------------- start
try {
  await request("/");
} catch (e) {
  console.error(`Cannot reach ${BASE}. Is the website running? (${e.message})`);
  process.exit(2);
}

console.log(`Testing ${BASE}`);
console.log(`Logged-in customer test: ${CUSTOMER ? "yes" : "no (set CUSTOMER_COOKIE)"}`);
console.log(`Logged-in admin test:    ${ADMIN ? "yes" : "no (set ADMIN_COOKIE)"}`);

// ---------------------------------------------------------------- headers
section("1. Security headers");
{
  const home = await request("/");
  const h = home.headers;

  await check("X-Content-Type-Options is nosniff", () => h.get("x-content-type-options") === "nosniff");
  await check("Clickjacking protection (X-Frame-Options DENY)", () => (h.get("x-frame-options") ?? "").toUpperCase() === "DENY");
  await check("Content-Security-Policy has frame-ancestors", () => (h.get("content-security-policy") ?? "").includes("frame-ancestors"));
  await check("Referrer-Policy is set", () => Boolean(h.get("referrer-policy")));
  await check("Permissions-Policy is set", () => Boolean(h.get("permissions-policy")));
  await check("X-Powered-By is hidden", () => !h.get("x-powered-by"));

  if (BASE.startsWith("https://")) {
    await check("HSTS is set", () => Boolean(h.get("strict-transport-security")));
  } else {
    console.log("  INFO  HSTS is only checked on https:// sites");
  }
}

// ----------------------------------------------- anonymous visitor, admin pages
section("2. A visitor who is NOT logged in cannot open admin pages");
for (const path of [
  "/admin",
  "/admin/orders",
  "/admin/orders/test",
  "/admin/orders/test/print",
  "/admin/products",
  "/admin/products/new",
  "/admin/categories",
  "/admin/customers",
  "/admin/reviews",
  "/admin/reports",
  "/admin/reports/2026/10",
  "/admin/blocked",
  "/admin/activity",
]) {
  await check(`GET ${path}`, async () => isBlocked(await request(path)));
}

// --------------------------------------------------- anonymous visitor, APIs
section("3. A visitor who is NOT logged in cannot use admin APIs");
{
  await check("GET /api/admin/counts is refused (403)", async () => (await request("/api/admin/counts")).status === 403);
  await check("Report download is refused (403)", async () => (await request("/api/admin/reports/export?year=2026&format=xlsx")).status === 403);
  await check("Upload is refused (403)", async () => (await request("/api/admin/upload", { method: "POST" })).status === 403);
  await check("A fake session cookie does not work (counts)", async () => (await request("/api/admin/counts", { cookie: "fakefakefakefake" })).status === 403);
  await check("A fake session cookie does not work (admin page)", async () => isBlocked(await request("/admin", { cookie: "fakefakefakefake" })));
  await check("POST on the download address is not allowed", async () => [404, 405].includes((await request("/api/admin/reports/export", { method: "POST" })).status));
}

// ---------------------------------------------------------------- cron
section("4. The scheduler address is closed");
{
  await check("POST without a secret is refused (401)", async () => (await request("/api/cron/expire-orders", { method: "POST" })).status === 401);
  await check("POST with a wrong secret is refused (401)", async () =>
    (await request("/api/cron/expire-orders", { method: "POST", headers: { authorization: "Bearer wrong-secret-value" } })).status === 401);
  await check("GET is not allowed", async () => [404, 405].includes((await request("/api/cron/expire-orders")).status));
}

// ------------------------------------------------------- files and traversal
section("5. Private files and uploads");
{
  for (const path of ["/.env", "/.env.local", "/.git/config", "/prisma/schema.prisma", "/package.json", "/next.config.ts", "/lib/auth.ts", "/app/actions/orders.ts"]) {
    await check(`${path} is not served`, async () => {
      const r = await request(path);
      const leaks = /DATABASE_URL|datasource|"dependencies"|createSession|placeOrder/.test(r.text);
      return r.status === 404 || (!leaks && r.status !== 200);
    });
  }

  for (const path of ["/uploads/..%2f..%2f.env", "/uploads/%2e%2e%2f.env", "/uploads/not-a-real-file.jpg", "/uploads/..%5c..%5cpackage.json"]) {
    await check(`GET ${path} finds nothing`, async () => {
      const r = await request(path);
      return r.status === 404 && !/DATABASE_URL|"dependencies"/.test(r.text);
    });
  }
}

// ------------------------------------------------------- bad input
section("6. Bad input does not break the site or leak details");
{
  const noLeak = (t) => !/PrismaClient|prisma\.|SQLSTATE|syntax error at|node_modules|ECONNREFUSED/i.test(t);
  const attacks = [
    ["Search with a script tag", `/search?q=${encodeURIComponent("<script>alert(1)</script>")}`],
    ["Search with SQL text", `/search?q=${encodeURIComponent("' OR '1'='1' --")}`],
    ["Search with a very long text", `/search?q=${"a".repeat(5000)}`],
    ["Category with SQL text", `/category/${encodeURIComponent("'; DROP TABLE \"User\";--")}`],
    ["Product with a null byte", "/products/%00"],
    ["Order success page with odd id", `/order-success?id=${encodeURIComponent("<img src=x onerror=alert(1)>")}`],
  ];

  for (const [name, path] of attacks) {
    await check(name, async () => {
      const r = await request(path);
      const reflected = r.text.includes("<script>alert(1)</script>") || r.text.includes("<img src=x onerror=alert(1)>");
      return [r.status < 500 && !reflected && noLeak(r.text), `status ${r.status}${reflected ? ", text was NOT escaped" : ""}`];
    });
  }

  await check("Other websites cannot read the admin API (no CORS)", async () => {
    const r = await request("/api/admin/counts", { headers: { origin: "https://evil.example" } });
    return !r.headers.get("access-control-allow-origin");
  });
}

// ----------------------------------------------------- logged-in customer
if (CUSTOMER) {
  section("7. A logged-in CUSTOMER cannot reach admin features");

  for (const path of ["/admin", "/admin/orders", "/admin/reports", "/admin/activity", "/admin/blocked", "/admin/orders/test/print"]) {
    await check(`GET ${path}`, async () => isBlocked(await request(path, { cookie: CUSTOMER })));
  }
  await check("Counts API is refused (403)", async () => (await request("/api/admin/counts", { cookie: CUSTOMER })).status === 403);
  await check("Report download is refused (403)", async () => (await request("/api/admin/reports/export?year=2026&format=xlsx", { cookie: CUSTOMER })).status === 403);
  await check("Upload is refused (403)", async () => (await request("/api/admin/upload", { method: "POST", cookie: CUSTOMER })).status === 403);
  await check("Own account page works", async () => (await request("/account", { cookie: CUSTOMER })).status === 200);
}

// ----------------------------------------------------------- logged-in admin
if (ADMIN) {
  section("8. A logged-in ADMIN can work, and bad input is refused");

  await check("Admin dashboard opens", async () => {
    const r = await request("/admin", { cookie: ADMIN });
    return r.status === 200 && hasMarker(r.text);
  });
  await check("Counts API answers with numbers", async () => {
    const r = await request("/api/admin/counts", { cookie: ADMIN });
    return r.status === 200 && /"pending"\s*:\s*\d+/.test(r.text);
  });
  await check("Counts API is not cached (no-store)", async () => ((await request("/api/admin/counts", { cookie: ADMIN })).headers.get("cache-control") ?? "").includes("no-store"));

  for (const q of ["year=1999&format=xlsx", "year=2026&format=exe", "year=2026&month=13&format=pdf", "year=abc&format=pdf", "year=2026&month=1;DROP&format=pdf"]) {
    await check(`Download with bad input is refused (${q})`, async () => (await request(`/api/admin/reports/export?${q}`, { cookie: ADMIN })).status === 400);
  }

  await check("Upload without a file is refused (400)", async () => (await request("/api/admin/upload", { method: "POST", cookie: ADMIN, headers: { "content-type": "multipart/form-data; boundary=x" }, body: "--x--" })).status === 400);
}

// ---------------------------------------------------------------- summary
const count = (s) => results.filter((r) => r.status === s).length;
const failed = results.filter((r) => r.status === "FAIL");

console.log("\n----------------------------------------");
console.log(`PASS ${count("PASS")}   WARN ${count("WARN")}   FAIL ${count("FAIL")}`);

if (failed.length > 0) {
  console.log("\nThese checks FAILED. Please look at them first:");
  for (const f of failed) console.log(`  - [${f.group}] ${f.name}`);
}

console.log("\nThis script checks the basics only. It cannot test: password rate limits,");
console.log("cookie flags (look in DevTools > Application > Cookies), or your server settings.");
process.exit(failed.length > 0 ? 1 : 0);