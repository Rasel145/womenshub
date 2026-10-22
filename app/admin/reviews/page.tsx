import { Suspense } from "react";
import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/order-status";
import StarRating from "@/components/product/StarRating";
import ReviewActions from "@/components/admin/ReviewActions";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ show?: string; page?: string }>;

export default function AdminReviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <ReviewsContent searchParams={searchParams} />
    </Suspense>
  );
}

function buildHref(params: { show?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.show && params.show !== "all") sp.set("show", params.show);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin/reviews?${qs}` : "/admin/reviews";
}

async function ReviewsContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const show = sp.show === "visible" || sp.show === "hidden" ? sp.show : "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(show === "visible" && { isVisible: true }),
    ...(show === "hidden" && { isVisible: false }),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { name: true, phone: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filters = [
    { key: "all", label: "All" },
    { key: "visible", label: "Visible" },
    { key: "hidden", label: "Hidden" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reviews</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={buildHref({ show: f.key })}
            className={clsx(
              "rounded-full px-3 py-1 text-sm",
              show === f.key ? "bg-pink-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          No reviews found.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/products/${r.product.slug}`}
                    className="font-medium text-pink-600"
                  >
                    {r.product.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating value={r.rating} />
                    {r.title && <span className="text-sm font-medium">{r.title}</span>}
                  </div>
                </div>
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    r.isVisible
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  {r.isVisible ? "Visible" : "Hidden"}
                </span>
              </div>

              <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{r.comment}</p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                <span>
                  {r.user.name} ({r.user.phone}) · {formatDateTime(r.createdAt)}
                </span>
                <ReviewActions id={r.id} visible={r.isVisible} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Page {page} of {totalPages} · {total} reviews
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ show, page: page - 1 })}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ show, page: page + 1 })}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}