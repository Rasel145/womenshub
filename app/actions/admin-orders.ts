"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, NEXT_STATUSES, type OrderStatus } from "@/lib/order-status";

type Result = { ok: true } | { ok: false; error: string };

export async function updateOrderStatus(
  orderId: string,
  nextStatus: string
): Promise<Result> {
  await requireAdmin();

  if (!ORDER_STATUSES.includes(nextStatus as OrderStatus))
    return { ok: false, error: "Invalid status." };
  const next = nextStatus as OrderStatus;

  try {
    // Returns an error message, or null when everything worked
    const error = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) return "Order not found.";

      const current = order.status as OrderStatus;
      if (!NEXT_STATUSES[current].includes(next))
        return `This order cannot move from ${current} to ${next}.`;

      // The "status: current" check stops two admins changing the same order at once
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: current },
        data: { status: next },
      });
      if (updated.count === 0)
        return "This order was just changed by someone else. Refresh and try again.";

      // A cancelled order gives its stock back
      if (next === "CANCELLED") {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      return null;
    });

    if (error) return { ok: false, error };
  } catch (e) {
    console.error("updateOrderStatus failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}