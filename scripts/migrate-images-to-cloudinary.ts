// Moves the pictures that are stored on this computer to Cloudinary and updates the database.
//
//   $env:DATABASE_URL = '...'     the database to update (for example your Neon database)
//   $env:CLOUDINARY_URL = '...'
//   npx tsx scripts/migrate-images-to-cloudinary.ts            only shows what would happen
//   npx tsx scripts/migrate-images-to-cloudinary.ts --apply    really does it

import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { cloudinaryConfigured, uploadImageToCloudinary } from "../lib/cloudinary";

const { Client } = pg;

const APPLY = process.argv.includes("--apply");
const NAME_RE = /^([a-f0-9]{32})\.(jpg|png|webp)$/;
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

// The file must really be the kind of picture its name says
function looksLikeImage(buf: Buffer, ext: string) {
  if (ext === "jpg") return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (ext === "png")
    return (
      buf.length > 8 &&
      buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  return buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
}

const moved = new Map<string, string>(); // old address -> new address
const seen = new Set<string>();
const problems: string[] = [];

// Returns the new address of a picture (or the old one if it must stay as it is)
async function convert(value: string): Promise<string> {
  if (!value.startsWith("/uploads/")) return value;
  if (moved.has(value)) return moved.get(value)!;

  const name = value.slice("/uploads/".length);
  const m = NAME_RE.exec(name);
  if (!m) {
    problems.push(`unexpected name: ${value}`);
    return value;
  }

  const file = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(file)) {
    problems.push(`file not found on this computer: ${name}`);
    return value;
  }

  const buf = fs.readFileSync(file);
  if (!looksLikeImage(buf, m[2])) {
    problems.push(`not a real picture: ${name}`);
    return value;
  }

  seen.add(value);
  if (!APPLY) return value;

  // The old file name is used as the new id, so running this again never makes copies
  const url = await uploadImageToCloudinary(buf, m[2], m[1]);
  moved.set(value, url);
  console.log(`  uploaded ${name}`);
  return url;
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) fail("Set DATABASE_URL first, for example: $env:DATABASE_URL = '...'");
  if (!cloudinaryConfigured()) fail("Set CLOUDINARY_URL first, for example: $env:CLOUDINARY_URL = '...'");

  let host = "(unknown)";
  try {
    host = new URL(dbUrl).hostname;
  } catch {}

  console.log(`Database:         ${host}`);
  console.log(`Pictures folder:  ${UPLOAD_DIR}`);
  console.log(`Mode:             ${APPLY ? "APPLY (changes the database)" : "DRY RUN (changes nothing)"}\n`);

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  let productsUpdated = 0;
  let usersUpdated = 0;

  try {
    // Product pictures
    const type = (
      await client.query(
        `SELECT data_type FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'Product' AND column_name = 'images'`
      )
    ).rows[0]?.data_type as string | undefined;

    const products = await client.query(`SELECT id, images FROM "Product"`);
    for (const row of products.rows) {
      const list: unknown = row.images;
      if (!Array.isArray(list)) continue;
      if (!list.some((v) => typeof v === "string" && v.startsWith("/uploads/"))) continue;

      const next: unknown[] = [];
      for (const v of list) next.push(typeof v === "string" ? await convert(v) : v);

      if (APPLY && JSON.stringify(next) !== JSON.stringify(list)) {
        if (type === "ARRAY")
          await client.query(`UPDATE "Product" SET images = $1::text[] WHERE id = $2`, [next, row.id]);
        else
          await client.query(`UPDATE "Product" SET images = $1::jsonb WHERE id = $2`, [
            JSON.stringify(next),
            row.id,
          ]);
        productsUpdated++;
      }
    }

    // Profile photos
    const users = await client.query(
      `SELECT id, "avatarUrl" FROM "User" WHERE "avatarUrl" LIKE '/uploads/%'`
    );
    for (const row of users.rows) {
      const next = await convert(row.avatarUrl as string);
      if (APPLY && next !== row.avatarUrl) {
        await client.query(`UPDATE "User" SET "avatarUrl" = $1 WHERE id = $2`, [next, row.id]);
        usersUpdated++;
      }
    }

    // Look in every table for an old "/uploads/" address that is still left
    const columns = await client.query(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name <> '_prisma_migrations'
         AND data_type IN ('text', 'character varying', 'ARRAY', 'json', 'jsonb')`
    );

    const left: string[] = [];
    for (const c of columns.rows) {
      const t = String(c.table_name).replace(/"/g, '""');
      const col = String(c.column_name).replace(/"/g, '""');
      const r = await client.query(
        `SELECT count(*)::int AS n FROM "${t}" WHERE "${col}"::text LIKE '%/uploads/%'`
      );
      if (r.rows[0].n > 0) left.push(`${c.table_name}.${c.column_name}: ${r.rows[0].n}`);
    }

    console.log("\n--- Result ---");
    console.log(`Pictures found:        ${APPLY ? moved.size : seen.size}`);
    console.log(
      APPLY
        ? `Products updated:      ${productsUpdated}\nProfile photos updated: ${usersUpdated}`
        : "Nothing was changed. Run again with --apply to do it."
    );
    console.log(
      left.length
        ? `Old /uploads/ addresses still in the database: ${left.join(", ")}`
        : "No old /uploads/ addresses are left in the database."
    );
    if (problems.length) {
      console.log("\nProblems (these pictures were NOT moved):");
      for (const p of problems) console.log(`  - ${p}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => fail(`Failed: ${e instanceof Error ? e.message : String(e)}`));