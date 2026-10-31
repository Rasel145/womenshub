"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { cancelStalePendingOrders, CANCEL_AFTER_HOURS } from "@/lib/order-expiry";

type Result = { ok: true; cancelled: number } | { ok: false; error: string };

export async function expireStaleOrders(): Promise<Result> {
  const admin = await requireAdmin();

  try {
    const cancelled = await cancelStalePendingOrders(CANCEL_AFTER_HOURS);

    await auditAs(admin, "order.expire", {
      details: `${cancelled} orders cancelled (older than ${CANCEL_AFTER_HOURS} hours)`,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    return { ok: true, cancelled };
  } catch (e) {
    console.error("expireStaleOrders failed:", e);
    return { ok: false, error: "Could not cancel the old orders. Please try again." };
  }
}