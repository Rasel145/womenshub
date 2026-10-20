import { connection } from "next/server";
import { readImage } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  await connection(); // always read from disk when requested

  const { name } = await params;
  const image = await readImage(name);

  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}