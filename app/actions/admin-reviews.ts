"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { refreshProductRating } from "@/lib/reviews";
import { auditAs } from "@/lib/audit";

type Result = { ok: true } | { ok: false; error: string };

export async function setReviewVisible(
  id: string,
  visible: boolean
): Promise<Result> {
  const admin = await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: { id },
        data: { isVisible: Boolean(visible) },
        select: { productId: true },
      });
      await refreshProductRating(tx, review.productId);
    });
  } catch (e) {
    console.error("setReviewVisible failed:", e);
    return { ok: false, error: "Could not update the review." };
  }

  await auditAs(admin, visible ? "review.show" : "review.hide", {
    targetType: "Review",
    targetId: id,
  });

  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function deleteReview(id: string): Promise<Result> {
  const admin = await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      const review = await tx.review.delete({
        where: { id },
        select: { productId: true },
      });
      await refreshProductRating(tx, review.productId);
    });
  } catch (e) {
    console.error("deleteReview failed:", e);
    return { ok: false, error: "Could not delete the review." };
  }

  await auditAs(admin, "review.delete", { targetType: "Review", targetId: id });

  revalidatePath("/admin/reviews");
  return { ok: true };
}