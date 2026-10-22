import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getReviewSummary, getReviews, getReviewState } from "@/lib/reviews";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function ProductReviews({ productId }: { productId: string }) {
  const user = await getCurrentUser();

  const [summary, reviews, state] = await Promise.all([
    getReviewSummary(productId),
    getReviews(productId),
    user ? getReviewState(productId, user.id) : Promise.resolve(null),
  ]);

  return (
    <section id="reviews" className="mt-12 scroll-mt-24 border-t pt-8">
      <h2 className="mb-6 text-xl font-bold">Customer reviews</h2>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        {/* Summary */}
        <div>
          {summary.total === 0 ? (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold">{summary.average}</span>
                <span className="pb-1 text-sm text-gray-500">out of 5</span>
              </div>
              <div className="mt-1">
                <StarRating value={summary.average} size={20} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {summary.total} {summary.total === 1 ? "review" : "reviews"}
              </p>

              <ul className="mt-4 space-y-1.5 text-sm">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.counts[star - 1];
                  const percent = summary.total ? Math.round((count / summary.total) * 100) : 0;
                  return (
                    <li key={star} className="flex items-center gap-2">
                      <span className="w-10 text-gray-600">{star} star</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <span
                          className="block h-full rounded-full bg-yellow-400"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="w-8 text-right text-gray-500">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="space-y-6">
          {/* Write or edit */}
          {!user && (
            <p className="rounded-xl border bg-white p-5 text-sm text-gray-600">
              <Link href="/login" className="font-medium text-pink-600">
                Log in
              </Link>{" "}
              to write a review.
            </p>
          )}

          {user && state?.canReview && (
            <ReviewForm
              productId={productId}
              initial={
                state.own
                  ? {
                      rating: state.own.rating,
                      title: state.own.title,
                      comment: state.own.comment,
                      hidden: !state.own.isVisible,
                    }
                  : undefined
              }
            />
          )}

          {user && state && !state.canReview && (
            <p className="rounded-xl border bg-white p-5 text-sm text-gray-600">
              You can review this product after an order that includes it has been
              delivered.
            </p>
          )}

          {/* List */}
          {reviews.length > 0 && (
            <ul className="divide-y">
              {reviews.map((r) => (
                <li key={r.id} className="py-5 first:pt-0">
                  <div className="flex items-center gap-2">
                    <StarRating value={r.rating} />
                    {r.title && <span className="font-medium">{r.title}</span>}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                    {r.comment}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {r.author} · {formatDate(r.createdAt)} ·{" "}
                    <span className="text-green-700">Verified purchase</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}