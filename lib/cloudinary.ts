import { createHash, randomBytes } from "node:crypto";

type Config = { cloudName: string; apiKey: string; apiSecret: string };

// CLOUDINARY_URL looks like: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
function readConfig(): Config | null {
  const raw = process.env.CLOUDINARY_URL?.trim();
  if (!raw) return null;

  const m = /^cloudinary:\/\/([^:@/\s]+):([^@/\s]+)@([^/?#\s]+)$/.exec(raw);
  if (!m) {
    console.error(
      "CLOUDINARY_URL is not in the expected form: cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
    );
    return null;
  }

  return { apiKey: m[1], apiSecret: m[2], cloudName: m[3] };
}

export function cloudinaryConfigured() {
  return readConfig() !== null;
}

const FOLDER = "womenshub";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Only pictures in exactly this form are accepted: https://res.cloudinary.com/<cloud>/image/upload/v123/womenshub/<32 letters or numbers>.jpg
const URL_RE =
  /^https:\/\/res\.cloudinary\.com\/([A-Za-z0-9_-]+)\/image\/upload\/(?:v\d+\/)?(womenshub\/[a-f0-9]{32})\.(?:jpg|png|webp)$/;

export function isCloudinaryUrl(url: string) {
  return URL_RE.test(url);
}

// Cloudinary signature: the parameters sorted by name, joined with "&", then the secret, then SHA-1
function sign(params: Record<string, string>, secret: string) {
  const text = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(text + secret)
    .digest("hex");
}

const now = () => String(Math.floor(Date.now() / 1000));

// Uploads a picture and returns its https address
export async function uploadImageToCloudinary(
  buffer: Buffer,
  ext: string,
  fixedId?: string
): Promise<string> {
  const cfg = readConfig();
  if (!cfg) throw new Error("Cloudinary is not set up (CLOUDINARY_URL is missing).");

  const id = fixedId ?? randomBytes(16).toString("hex");
  const publicId = `${FOLDER}/${id}`;
  const timestamp = now();

  // "overwrite=false": if a picture with the same id is already there, it is reused. This makes
  // the migration safe to run again.
  const signature = sign({ overwrite: "false", public_id: publicId, timestamp }, cfg.apiSecret);

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: MIME[ext] ?? "application/octet-stream" }),
    `${id}.${ext}`
  );
  form.append("api_key", cfg.apiKey);
  form.append("timestamp", timestamp);
  form.append("public_id", publicId);
  form.append("overwrite", "false");
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(30000),
  });

  const data = (await res.json().catch(() => ({}))) as {
    secure_url?: string;
    error?: { message?: string };
  };

  if (!res.ok || typeof data.secure_url !== "string") {
    throw new Error(
      `Cloudinary upload failed (${res.status}): ${data.error?.message ?? "unknown reason"}`
    );
  }

  // Never store an address that is not in the expected form
  if (!URL_RE.test(data.secure_url))
    throw new Error("Cloudinary returned an address in an unexpected form.");

  return data.secure_url;
}

// Deletes a picture that this shop uploaded. Anything else is ignored.
export async function deleteFromCloudinary(url: string): Promise<void> {
  const cfg = readConfig();
  const m = URL_RE.exec(url);
  if (!cfg || !m || m[1] !== cfg.cloudName) return;

  const publicId = m[2];
  const timestamp = now();
  const signature = sign({ invalidate: "true", public_id: publicId, timestamp }, cfg.apiSecret);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`, {
      method: "POST",
      body: new URLSearchParams({
        public_id: publicId,
        timestamp,
        invalidate: "true",
        api_key: cfg.apiKey,
        signature,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) console.error(`Cloudinary delete failed (${res.status})`);
  } catch (e) {
    // A picture that stays behind is not a reason to stop the admin's real work
    console.error("Cloudinary delete failed:", e);
  }
}