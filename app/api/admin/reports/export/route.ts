import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { checkLimits, getClientIp, tooManyMessage } from "@/lib/rate-limit";
import { MAX_EXPORT_ORDERS, dhakaNow, getExportOrders } from "@/lib/reports";
import { buildExcel } from "@/lib/report-excel";
import { buildPdf } from "@/lib/report-pdf";

// export const runtime = "nodejs";

const FILE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: FILE_HEADERS });
}

export async function GET(request: Request) {
  // Only admins. Everyone else gets the same answer, whatever they ask for.
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return fail("Not allowed.", 403);

  // Every value from the address is checked before it is used
  const params = new URL(request.url).searchParams;
  const year = Number(params.get("year"));
  const monthParam = params.get("month");
  const month = monthParam === null ? undefined : Number(monthParam);
  const format = params.get("format");

  if (!Number.isInteger(year) || year < 2020 || year > dhakaNow().year + 1)
    return fail("Invalid year.", 400);
  if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12))
    return fail("Invalid month.", 400);
  if (format !== "xlsx" && format !== "pdf") return fail("Invalid format.", 400);

  // A report holds customer data, so downloads are limited
  const limited = await checkLimits([
    { key: `export:user:${user.id}`, limit: 30, windowSeconds: 60 * 60 },
  ]);
  if (!limited.allowed) return fail(tooManyMessage(limited.retryAfterSeconds), 429);

  try {
    const { orders, tooMany } = await getExportOrders(year, month);

    if (tooMany)
      return fail(
        `This period has more than ${MAX_EXPORT_ORDERS} orders. Please download one month at a time.`,
        413
      );

    const ip = await getClientIp();
    await logAudit(prisma, {
      userId: user.id,
      action: "report.export",
      targetType: "Report",
      details: `${year}${month ? `-${String(month).padStart(2, "0")}` : ""} ${format}, ${orders.length} orders`,
      ip,
    });

    const name = `womenshub-orders-${year}${month ? `-${String(month).padStart(2, "0")}` : ""}.${format}`;

    if (format === "xlsx") {
      const file = await buildExcel({ orders, year, month });
      return new Response(new Uint8Array(file), {
        headers: {
          ...FILE_HEADERS,
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${name}"`,
        },
      });
    }

    const file = await buildPdf({ orders, year, month });
    return new Response(new Uint8Array(file), {
      headers: {
        ...FILE_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch (e) {
    console.error("report export failed:", e);
    return fail("Could not create the report. Please try again.", 500);
  }
}