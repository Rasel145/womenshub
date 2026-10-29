"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { ORDER_STATUSES, NEXT_STATUSES, type OrderStatus } from "@/lib/order-status";

type Result = { ok: true } | { ok: false; error: string };

const COURIERS = ["Steadfast", "Pathao", "RedX", "Own rider", "Other"];
const CODE_RE = /^[A-Za-z0-9\-_/. ]*$/;

const STATUS_MESSAGE: Record<OrderStatus, string> = {
  PENDING: "Order is waiting for confirmation",
  CONFIRMED: "Order confirmed",
  SHIPPED: "Order shipped",
  DELIVERED: "Order delivered",
  CANCELLED: "Order cancelled",
};

function refresh(orderId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

function badId(id: unknown) {
  return typeof id !== "string" || id.length === 0 || id.length > 40;
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: string
): Promise<Result> {
  const admin = await requireAdmin();
  const ip = await getClientIp();

  if (badId(orderId)) return { ok: false, error: "Order not found." };
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
        data: { status: next, adminSeenAt: order.adminSeenAt ?? new Date() },
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

      // The customer-visible timeline and the admin activity log
      await tx.orderEvent.create({
        data: {
          orderId,
          status: next,
          message: STATUS_MESSAGE[next],
          createdById: admin.id,
        },
      });
      await logAudit(tx, {
        userId: admin.id,
        action: "order.status",
        targetType: "Order",
        targetId: orderId,
        details: `${current} -> ${next}`,
        ip,
      });
      return null;
    });

    if (error) return { ok: false, error };
  } catch (e) {
    console.error("updateOrderStatus failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  refresh(orderId);
  return { ok: true };
}

// Called when the admin opens an order, so it stops counting as "new"
export async function markOrderSeen(orderId: string): Promise<void> {
  await requireAdmin();
  if (badId(orderId)) return;

  await prisma.order.updateMany({
    where: { id: orderId, adminSeenAt: null },
    data: { adminSeenAt: new Date() },
  });
}

export async function saveShippingInfo(
  orderId: string,
  input: { courier: string; trackingCode: string; consignmentId: string }
): Promise<Result> {
  const admin = await requireAdmin();
  const ip = await getClientIp();

  if (badId(orderId)) return { ok: false, error: "Order not found." };

  const courier = input.courier?.trim() ?? "";
  const trackingCode = input.trackingCode?.trim() ?? "";
  const consignmentId = input.consignmentId?.trim() ?? "";

  if (courier && !COURIERS.includes(courier))
    return { ok: false, error: "Choose a courier from the list." };
  if (trackingCode.length > 60 || !CODE_RE.test(trackingCode))
    return { ok: false, error: "The tracking code can only have letters, numbers and - _ / . (up to 60)." };
  if (consignmentId.length > 40 || !CODE_RE.test(consignmentId))
    return { ok: false, error: "The consignment ID can only have letters, numbers and - _ / . (up to 40)." };

  try {
    const error = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { status: true, courier: true, trackingCode: true },
      });
      if (!order) return "Order not found.";
      if (order.status === "CANCELLED") return "A cancelled order cannot be shipped.";

      await tx.order.update({
        where: { id: orderId },
        data: {
          courier: courier || null,
          trackingCode: trackingCode || null,
          consignmentId: consignmentId || null,
        },
      });

      // Tell the customer when the courier or tracking code changes
      const changed =
        (order.courier ?? "") !== courier || (order.trackingCode ?? "") !== trackingCode;
      if (changed && (courier || trackingCode)) {
        await tx.orderEvent.create({
          data: {
            orderId,
            message: `Courier: ${courier || "not set"}${
              trackingCode ? `, tracking code: ${trackingCode}` : ""
            }`,
            createdById: admin.id,
          },
        });
      }

      await logAudit(tx, {
        userId: admin.id,
        action: "order.shipping",
        targetType: "Order",
        targetId: orderId,
        details: courier ? `courier: ${courier}` : "courier cleared",
        ip,
      });
      return null;
    });

    if (error) return { ok: false, error };
  } catch (e) {
    console.error("saveShippingInfo failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  refresh(orderId);
  return { ok: true };
}

export async function addOrderEvent(
  orderId: string,
  input: { message: string; location: string; visibleToCustomer: boolean }
): Promise<Result> {
  const admin = await requireAdmin();
  const ip = await getClientIp();

  if (badId(orderId)) return { ok: false, error: "Order not found." };

  const message = input.message?.trim() ?? "";
  const location = input.location?.trim() ?? "";

  if (message.length < 3 || message.length > 200)
    return { ok: false, error: "The update must be 3 to 200 characters." };
  if (location.length > 80)
    return { ok: false, error: "The location can be up to 80 characters." };

  try {
    const exists = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!exists) return { ok: false, error: "Order not found." };

    await prisma.$transaction(async (tx) => {
      await tx.orderEvent.create({
        data: {
          orderId,
          message,
          location: location || null,
          visibleToCustomer: Boolean(input.visibleToCustomer),
          createdById: admin.id,
        },
      });
      await logAudit(tx, {
        userId: admin.id,
        action: "order.event",
        targetType: "Order",
        targetId: orderId,
        ip,
      });
    });
  } catch (e) {
    console.error("addOrderEvent failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  refresh(orderId);
  return { ok: true };
}

// Fixing the customer's details is allowed only until the order is shipped
export async function updateOrderDetails(
  orderId: string,
  input: { name: string; phone: string; address: string; city: string; note: string }
): Promise<Result> {
  const admin = await requireAdmin();
  const ip = await getClientIp();

  if (badId(orderId)) return { ok: false, error: "Order not found." };

  const name = input.name?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const address = input.address?.trim() ?? "";
  const city = input.city?.trim() ?? "";
  const note = input.note?.trim() ?? "";

  if (name.length < 3 || name.length > 80)
    return { ok: false, error: "Enter the customer's full name." };
  if (!/^01[3-9]\d{8}$/.test(phone))
    return { ok: false, error: "Enter a valid mobile number." };
  if (address.length < 10 || address.length > 300)
    return { ok: false, error: "The address must be 10 to 300 characters." };
  if (city.length < 2 || city.length > 60)
    return { ok: false, error: "Enter the city or district." };
  if (note.length > 300)
    return { ok: false, error: "The customer note can be up to 300 characters." };

  try {
    const error = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) return "Order not found.";
      if (order.status !== "PENDING" && order.status !== "CONFIRMED")
        return "The details can be changed only before the order is shipped.";

      const changed = (
        [
          ["name", order.name, name],
          ["phone", order.phone, phone],
          ["address", order.address, address],
          ["city", order.city, city],
          ["note", order.note ?? "", note],
        ] as const
      )
        .filter(([, before, after]) => before !== after)
        .map(([field]) => field);

      if (changed.length === 0) return null;

      await tx.order.update({
        where: { id: orderId },
        data: { name, phone, address, city, note: note || null },
      });

      // Only the NAMES of the changed fields are logged, not the personal data itself
      await logAudit(tx, {
        userId: admin.id,
        action: "order.edit",
        targetType: "Order",
        targetId: orderId,
        details: `changed: ${changed.join(", ")}`,
        ip,
      });
      return null;
    });

    if (error) return { ok: false, error };
  } catch (e) {
    console.error("updateOrderDetails failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  refresh(orderId);
  return { ok: true };
}

// Private note for the team. The customer never sees it.
export async function saveAdminNote(orderId: string, note: string): Promise<Result> {
  const admin = await requireAdmin();
  const ip = await getClientIp();

  if (badId(orderId)) return { ok: false, error: "Order not found." };

  const text = note?.trim() ?? "";
  if (text.length > 500)
    return { ok: false, error: "The note can be up to 500 characters." };

  try {
    const exists = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!exists) return { ok: false, error: "Order not found." };

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { adminNote: text || null },
      });
      await logAudit(tx, {
        userId: admin.id,
        action: "order.note",
        targetType: "Order",
        targetId: orderId,
        ip,
      });
    });
  } catch (e) {
    console.error("saveAdminNote failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  refresh(orderId);
  return { ok: true };
}