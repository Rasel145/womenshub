import { Suspense } from "react";
import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_STATUSES,
  STATUS_LABEL,
  STATUS_STYLE,
  PAYMENT_LABEL,
  formatDateTime,
  type OrderStatus,
} from "@/lib/order-status";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ status?: string; q?: string; page?: string }>;

export default function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <OrdersContent searchParams={searchParams} />
    </Suspense>
  );
}

function buildHref(params: { status?: string; q?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

async function OrdersContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const status = ORDER_STATUSES.find((s) => s === sp.status);
  const q = (sp.q ?? "").trim().slice(0, 50);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(status && { status }),
    ...(q && {
      OR: [
        { orderNumber: { contains: q, mode: "insensitive" as const } },
        { name: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q } },
      ],
    }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Orders</h1>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={buildHref({ q })}
          className={clsx(
            "rounded-full px-3 py-1 text-sm",
            !status ? "bg-pink-600 text-white" : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={buildHref({ status: s, q })}
            className={clsx(
              "rounded-full px-3 py-1 text-sm",
              status === s ? "bg-pink-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form action="/admin/orders" method="get" className="mb-4 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search order number, name or phone"
          className="w-full max-w-sm rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
        >
          Search
        </button>
      </form>

      {orders.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          No orders found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/orders/${o.id}`} className="text-pink-600">
                      #{o.orderNumber}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {formatDateTime(o.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p>{o.name}</p>
                    <p className="text-xs text-gray-500">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatPrice(o.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        STATUS_STYLE[o.status as OrderStatus]
                      )}
                    >
                      {STATUS_LABEL[o.status as OrderStatus]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Page {page} of {totalPages} · {total} orders
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ status, q, page: page - 1 })}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ status, q, page: page + 1 })}
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