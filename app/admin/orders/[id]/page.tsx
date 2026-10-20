import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import OrderStatusActions from "@/components/admin/OrderStatusActions";
import {
  STATUS_LABEL,
  STATUS_STYLE,
  PAYMENT_LABEL,
  formatDateTime,
  type OrderStatus,
} from "@/lib/order-status";

export default function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { name: true, phone: true } } },
  });
  if (!order) notFound();

  const status = order.status as OrderStatus;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600"
      >
        <ArrowLeft size={16} />
        All orders
      </Link>

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium",
            STATUS_STYLE[status]
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        Placed on {formatDateTime(order.createdAt)}
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Items */}
          <section className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Items</h2>
            <ul className="divide-y text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    {item.variant && (
                      <p className="text-xs text-gray-500">Option: {item.variant}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Delivery</dt>
                <dd>
                  {order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <dt>Total</dt>
                <dd className="text-pink-600">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* Status */}
          <section className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Update status</h2>
            <OrderStatusActions orderId={order.id} current={status} />
          </section>
        </div>

        {/* Customer */}
        <aside className="h-fit space-y-5 rounded-xl border bg-white p-5 text-sm">
          <div>
            <h2 className="mb-2 font-semibold">Customer</h2>
            <p>{order.name}</p>
            <p className="text-gray-500">{order.phone}</p>
            <p className="mt-1 text-xs text-gray-400">
              {order.user ? "Registered customer" : "Guest checkout"}
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-semibold">Delivery address</h2>
            <p className="whitespace-pre-line text-gray-600">{order.address}</p>
            <p className="text-gray-600">{order.city}</p>
            <p className="mt-1 text-xs text-gray-400">
              {order.area === "DHAKA" ? "Inside Dhaka" : "Outside Dhaka"}
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-semibold">Payment</h2>
            <p className="text-gray-600">
              {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
            </p>
          </div>

          {order.note && (
            <div>
              <h2 className="mb-2 font-semibold">Customer note</h2>
              <p className="text-gray-600">{order.note}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}