import { Suspense } from "react";
import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { getAdminCounts } from "@/lib/admin-counts";
import { STATUS_LABEL, STATUS_STYLE, type OrderStatus } from "@/lib/order-status";
import {
  countStalePending,
  WARN_AFTER_HOURS,
  CANCEL_AFTER_HOURS,
} from "@/lib/order-expiry";
import ExpireOrdersButton from "@/components/admin/ExpireOrdersButton";

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  await requireAdmin();

  const [
    totalOrders,
    counts,
    delivered,
    lowStock,
    customers,
    recent,
    waitingLong,
    readyToCancel,
  ] = await Promise.all([
    prisma.order.count(),
    getAdminCounts(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: "DELIVERED" },
    }),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    countStalePending(WARN_AFTER_HOURS),
    countStalePending(CANCEL_AFTER_HOURS),
  ]);

  const stats = [
    { label: "New orders (not opened)", value: counts.unseen.toString(), highlight: counts.unseen > 0 },
    { label: "Pending orders", value: counts.pending.toString(), highlight: counts.pending > 0 },
    { label: "Total orders", value: totalOrders.toString() },
    { label: "Delivered revenue", value: formatPrice(delivered._sum.total ?? 0) },
    { label: "Low stock products", value: lowStock.toString(), highlight: lowStock > 0 },
    { label: "Customers", value: customers.toString() },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      {waitingLong > 0 && (
        <div className="mb-6 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          <p className="font-medium">
            {waitingLong} pending {waitingLong === 1 ? "order has" : "orders have"} been
            waiting more than {WARN_AFTER_HOURS} hours.
          </p>
          <p className="mt-1">
            Confirm or cancel {waitingLong === 1 ? "it" : "them"} so customers are not kept
            waiting. Orders still pending after {CANCEL_AFTER_HOURS} hours are cancelled
            automatically.
          </p>
          <Link
            href="/admin/orders?status=PENDING"
            className="mt-2 inline-block font-medium underline"
          >
            View pending orders
          </Link>

          {readyToCancel > 0 && (
            <ExpireOrdersButton count={readyToCancel} hours={CANCEL_AFTER_HOURS} />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p
              className={clsx(
                "mt-1 text-2xl font-bold",
                s.highlight && "text-pink-600"
              )}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-pink-600">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">
            No orders yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((o) => {
              const isNew = o.status === "PENDING" && !o.adminSeenAt;

              return (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm hover:bg-gray-50"
                  >
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        #{o.orderNumber}
                        {isNew && (
                          <span className="rounded-full bg-pink-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                            NEW
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{o.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(o.total)}</p>
                      <span
                        className={clsx(
                          "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_STYLE[o.status as OrderStatus]
                        )}
                      >
                        {STATUS_LABEL[o.status as OrderStatus]}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}