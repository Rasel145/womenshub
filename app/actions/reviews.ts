"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { refreshProductRating } from "@/lib/reviews";
import { checkLimits, tooManyMessage } from "@/lib/rate-limit"; // NEW

type Result = { ok: true } | { ok: false; error: string };

export async function submitReview(input: {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to write a review." };

  const productId = input.productId;
  const rating = input.rating;
  const title = input.title?.trim() ?? "";
  const comment = input.comment?.trim() ?? "";

  if (typeof productId !== "string" || productId.length === 0 || productId.length > 40)
    return { ok: false, error: "Product not found." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { ok: false, error: "Choose a rating from 1 to 5 stars." };
  if (title.length > 80)
    return { ok: false, error: "The title can be up to 80 characters." };
  if (comment.length < 10 || comment.length > 1000)
    return { ok: false, error: "Your review must be 10 to 1000 characters." };

  // NEW: at most 10 review saves per hour for one customer
  const limited = await checkLimits([
    { key: `review:user:${user.id}`, limit: 10, windowSeconds: 60 * 60 },
  ]);
  if (!limited.allowed)
    return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  try {
    // Checked on the server, so nobody can skip it from the browser
    const delivered = await prisma.orderItem.findFirst({
      where: { productId, order: { userId: user.id, status: "DELIVERED" } },
      select: { id: true },
    });
    if (!delivered)
      return {
        ok: false,
        error: "Only customers who have received this product can review it.",
      };

    await prisma.$transaction(async (tx) => {
      // One review per customer per product. Editing keeps the visibility the store set.
      await tx.review.upsert({
        where: { userId_productId: { userId: user.id, productId } },
        create: {
          userId: user.id,
          productId,
          rating,
          title: title || null,
          comment,
        },
        update: { rating, title: title || null, comment },
      });
      await refreshProductRating(tx, productId);
    });
  } catch (e) {
    console.error("submitReview failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}

export async function deleteMyReview(productId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in first." };

  if (typeof productId !== "string" || productId.length === 0 || productId.length > 40)
    return { ok: false, error: "Product not found." };

  // NEW
  const limited = await checkLimits([
    { key: `review-delete:user:${user.id}`, limit: 20, windowSeconds: 60 * 60 },
  ]);
  if (!limited.allowed)
    return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.deleteMany({ where: { userId: user.id, productId } });
      await refreshProductRating(tx, productId);
    });
  } catch (e) {
    console.error("deleteMyReview failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}