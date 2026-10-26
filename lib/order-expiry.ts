import { prisma } from "@/lib/prisma";

// Admin sees a warning after this many hours without confirmation
export const WARN_AFTER_HOURS = 24;
// Orders nobody confirmed for this long are cancelled and their stock is returned
export const CANCEL_AFTER_HOURS = 48;

function cutoff(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export async function countStalePending(hours: number) {
  return prisma.order.count({
    where: { status: "PENDING", createdAt: { lt: cutoff(hours) } },
  });
}

// Cancels orders that nobody confirmed in time and gives their stock back.
// Returns how many orders were cancelled.
export async function cancelStalePendingOrders(
  hours = CANCEL_AFTER_HOURS,
  limit = 200
): Promise<number> {
  const stale = await prisma.order.findMany({
    where: { status: "PENDING", createdAt: { lt: cutoff(hours) } },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let cancelled = 0;

  for (const { id } of stale) {
    try {
      const done = await prisma.$transaction(async (tx) => {
        // Only cancel if it is STILL pending (an admin may have confirmed it a moment ago)
        const result = await tx.order.updateMany({
          where: { id, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
        if (result.count === 0) return false;

        const items = await tx.orderItem.findMany({
          where: { orderId: id },
          select: { productId: true, quantity: true },
        });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        return true;
      });

      if (done) cancelled += 1;
    } catch (e) {
      // One failed order must not stop the others
      console.error(`Could not cancel stale order ${id}:`, e);
    }
  }

  return cancelled;
}