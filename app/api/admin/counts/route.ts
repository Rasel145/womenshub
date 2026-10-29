import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminCounts } from "@/lib/admin-counts";

// The admin pages ask this every 30 seconds to show new orders
export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  return NextResponse.json(await getAdminCounts(), {
    headers: { "Cache-Control": "no-store" },
  });
}