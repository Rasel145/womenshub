import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";


// Images live outside /public, so they also work after "next build"
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

export type ImageExt = keyof typeof CONTENT_TYPES;

// Only URLs in this exact shape are accepted for products
export const IMAGE_URL_RE = /^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/;
const FILE_NAME_RE = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

// Reads the real file type from the first bytes. The type sent by the browser is never trusted.
export function detectImageExt(buf: Buffer): ImageExt | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "jpg";

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length > 8 && buf.subarray(0, 8).equals(pngSignature)) return "png";

  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "webp";

  return null;
}

export async function saveImage(buf: Buffer, ext: ImageExt) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomBytes(16).toString("hex")}.${ext}`;
    await writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
}

export async function readImage(name: string) {
  // The strict name check also blocks path tricks like "../.env"
  if (!FILE_NAME_RE.test(name)) return null;

  try {
    const data = await readFile(path.join(/*turbopackIgnore: true*/UPLOAD_DIR, name));
    const ext = name.split(".")[1] as ImageExt;
    return { data, contentType: CONTENT_TYPES[ext] };
  } catch {
    return null;
  }
}

// Deletes a stored image file. Only URLs in the exact upload format are accepted,
// so this can never remove any other file.
export async function deleteStoredImage(url: string | null | undefined) {
  if (!url || !IMAGE_URL_RE.test(url)) return;

  try {
    await unlink(path.join(/*turbopackIgnore: true*/UPLOAD_DIR, url.slice("/uploads/".length)));
  } catch {
    // The file is already gone, which is fine
  }
}