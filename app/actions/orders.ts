"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDeliveryCharge } from "@/lib/delivery";
import { checkLimits, getClientIp, hashKey, tooManyMessage } from "@/lib/rate-limit"; // NEW

type OrderInput = {
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
    note?: string;
  };
  area: "dhaka" | "outside";
  payment: "cod" | "bkash" | "nagad";
  items: { productId: string; variant?: string; quantity: number }[];
};

type OrderResult = { ok: true; orderNumber: string } | { ok: false; error: string };

// Errors with a message that is safe to show to the customer
class OrderError extends Error {}

function validate(input: OrderInput) {
  const { customer, area, payment, items } = input;

  if (!Array.isArray(items) || items.length === 0)
    throw new OrderError("Your cart is empty.");
  if (items.length > 50) throw new OrderError("Too many items in one order.");

  for (const item of items) {
    if (
      typeof item.productId !== "string" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    )
      throw new OrderError("Invalid item in your cart.");
  }

  if (customer.name.trim().length < 3) throw new OrderError("Enter your full name.");
  if (!/^01[3-9]\d{8}$/.test(customer.phone.trim()))
    throw new OrderError("Enter a valid mobile number.");
  if (customer.address.trim().length < 10) throw new OrderError("Enter your full address.");
  if (customer.city.trim().length < 2) throw new OrderError("Enter your city or district.");
  if ((customer.note ?? "").length > 300)
    throw new OrderError("Order note is too long.");

  if (area !== "dhaka" && area !== "outside")
    throw new OrderError("Invalid delivery area.");
  if (payment !== "cod")
    throw new OrderError("Online payment is not available yet. Please choose Cash on Delivery.");
}

export async function placeOrder(input: OrderInput): Promise<OrderResult> {
  try {
    validate(input);

    // NEW: limits against fake-order floods
    const ipKey = hashKey(await getClientIp());
    const phoneKey = hashKey(input.customer.phone.trim());
    const limited = await checkLimits([
      { key: `order:ip:${ipKey}`, limit: 40, windowSeconds: 60 * 60 },
      { key: `order:phone:${phoneKey}`, limit: 5, windowSeconds: 60 * 60 },
    ]);
    if (!limited.allowed)
      return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

    // Logged-in customers get the order attached to their account, guests get null
    const user = await getCurrentUser();

    const order = await prisma.$transaction(async (tx) => {
      // Always read prices and stock from the database, never from the browser
      const ids = [...new Set(input.items.map((i) => i.productId))];
      const dbProducts = await tx.product.findMany({
        where: { id: { in: ids }, isActive: true },
      });
      const byId = new Map(dbProducts.map((p) => [p.id, p]));

      let subtotal = 0;
      const lines = input.items.map((item) => {
        const product = byId.get(item.productId);
        if (!product)
          throw new OrderError(
            "A product in your cart is no longer available. Please clear your cart and add it again."
          );

        if (
          product.variants.length > 0 &&
          (!item.variant || !product.variants.includes(item.variant))
        )
          throw new OrderError(`Please choose a valid option for ${product.name}.`);

        subtotal += product.price * item.quantity;
        return { product, item };
      });

      // Reduce stock. The "gte" check makes sure two customers cannot buy the last item together.
      for (const { product, item } of lines) {
        const result = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0)
          throw new OrderError(`Sorry, ${product.name} does not have enough stock.`);
      }

      const deliveryFee = getDeliveryCharge(subtotal, input.area);

      return tx.order.create({
        data: {
          orderNumber: `WH-${randomBytes(4).toString("hex").toUpperCase()}`,
          userId: user?.id ?? null,
          name: input.customer.name.trim(),
          phone: input.customer.phone.trim(),
          address: input.customer.address.trim(),
          city: input.customer.city.trim(),
          note: input.customer.note?.trim() || null,
          area: input.area === "dhaka" ? "DHAKA" : "OUTSIDE",
          paymentMethod: "COD",
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          items: {
            create: lines.map(({ product, item }) => ({
              productId: product.id,
              productName: product.name,
              variant: item.variant ?? null,
              unitPrice: product.price,
              quantity: item.quantity,
            })),
          },
        },
      });
    });

    return { ok: true, orderNumber: order.orderNumber };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error("placeOrder failed:", e);
    return {
      ok: false,
      error: "Something went wrong while placing your order. Please try again.",
    };
  }
}