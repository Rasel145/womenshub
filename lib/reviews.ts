import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

// Works with the normal client and inside a transaction
type Db = Pick<typeof prisma, "review" | "product">;

// Recalculates the average rating and review count stored on the product.
// Call this every time a review is added, changed, hidden, shown or deleted.
export async function refreshProductRating(db: Db, productId: string) {
  const agg = await db.review.aggregate({
    where: { productId, isVisible: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await db.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewCount: agg._count._all,
    },
  });
}

// "Nusrat Jahan" -> "Nusrat J." (full names are not shown publicly)
function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] || "Customer";
  const last = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
  return first + last;
}

export async function getReviewSummary(productId: string) {
  await connection();

  const groups = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, isVisible: true },
    _count: { _all: true },
  });

  const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star ... index 4 = 5 stars
  let total = 0;
  let sum = 0;

  for (const g of groups) {
    if (g.rating >= 1 && g.rating <= 5) {
      counts[g.rating - 1] = g._count._all;
      total += g._count._all;
      sum += g.rating * g._count._all;
    }
  }

  return {
    total,
    average: total ? Math.round((sum / total) * 10) / 10 : 0,
    counts,
  };
}

export async function getReviews(productId: string, limit = 20) {
  await connection();

  const rows = await prisma.review.findMany({
    where: { productId, isVisible: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    createdAt: r.createdAt,
    author: shortName(r.user.name),
  }));
}

// What this customer can do on this product
export async function getReviewState(productId: string, userId: string) {
  await connection();

  const [own, delivered] = await Promise.all([
    prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    }),
    // Only customers who received the product can review it
    prisma.orderItem.findFirst({
      where: { productId, order: { userId, status: "DELIVERED" } },
      select: { id: true },
    }),
  ]);

  return { own, canReview: Boolean(delivered) };
}