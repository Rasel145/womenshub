import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkLimits, tooManyMessage } from "@/lib/rate-limit";
import { deleteStoredImage, detectImageExt, saveImage } from "@/lib/storage";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const HEADERS = { "Cache-Control": "no-store" };

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: HEADERS });
}

// A request that comes from another website is refused (on the live site).
function fromOtherSite(request: Request) {
  // Behind a development tunnel the Origin and Host headers are rewritten, so this check
  // cannot work there. The login cookie is SameSite=Lax, which also protects uploads.
  if (process.env.NODE_ENV !== "production") return false;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const originHost = new URL(origin).host;
    const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")]
      .filter(Boolean)
      .flatMap((h) => String(h).split(",").map((s) => s.trim()));

    return !hosts.includes(originHost);
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Please log in first.", 401);
  if (fromOtherSite(request)) return fail("Not allowed.", 403);

  const limited = await checkLimits([
    { key: `avatar:user:${user.id}`, limit: 10, windowSeconds: 60 * 60 },
  ]);
  if (!limited.allowed) return fail(tooManyMessage(limited.retryAfterSeconds), 429);

  // Refuse a huge upload before reading it
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_AVATAR_BYTES + 100 * 1024)
    return fail("The photo must be smaller than 2 MB.", 413);

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fail("No photo was uploaded.", 400);
  }

  if (!(file instanceof File)) return fail("No photo was uploaded.", 400);
  if (file.size === 0 || file.size > MAX_AVATAR_BYTES)
    return fail("The photo must be smaller than 2 MB.", 400);

  // The real file type is read from the first bytes, the type sent by the browser is never trusted
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExt(buffer);
  if (!ext) return fail("Only JPG, PNG or WebP photos are allowed.", 400);

  try {
    const url = await saveImage(buffer, ext);

    const before = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    });
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: url } });

    // The old photo is removed so unused files do not pile up
    await deleteStoredImage(before?.avatarUrl);

    return NextResponse.json({ url }, { headers: HEADERS });
  } catch (e) {
    console.error("avatar upload failed:", e);
    return fail("Could not save the photo. Please try again.", 500);
  }
}