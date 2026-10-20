import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import {
  STATUS_LABEL,
  STATUS_STYLE,
  formatDateTime,
  type OrderStatus,
} from "@/lib/order-status";

export default function AdminCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <CustomerContent params={params} />
    </Suspense>
  );
}

async function CustomerContent({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    // Never select passwordHash
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      createdAt: true,
      _count: { select: { wishlist: true } },
    },
  });
  if (!user) notFound();

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { quantity: true } } },
  });

  const counted = orders.filter((o) => o.status !== "CANCELLED");
  const spent = counted.reduce((sum, o) => sum + o.total, 0);
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;

  const stats = [
    { label: "Orders", value: counted.length.toString() },
    { label: "Delivered", value: delivered.toString() },
    { label: "Total spent", value: formatPrice(spent) },
    { label: "Wishlist items", value: user._count.wishlist.toString() },
  ];

  return (
    <div>
      <Link
        href="/admin/customers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600"
      >
        <ArrowLeft size={16} />
        All customers
      </Link>

      <h1 className="mb-1 text-2xl font-bold">{user.name}</h1>
      <p className="mb-6 text-sm text-gray-500">
        Customer since {formatDateTime(user.createdAt)}
      </p>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit space-y-5 rounded-xl border bg-white p-5 text-sm">
          <div>
            <h2 className="mb-2 font-semibold">Contact</h2>
            <p className="text-gray-600">{user.phone}</p>
            <p className="text-gray-600">{user.email ?? "No email added"}</p>
          </div>

          <dl className="grid grid-cols-2 gap-3 border-t pt-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-gray-500">{s.label}</dt>
                <dd className="mt-0.5 font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </aside>

        <section>
          <h2 className="mb-3 font-semibold">Orders</h2>

          {orders.length === 0 ? (
            <p className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">
              This customer has not placed any orders yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Items</th>
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
                      <td className="px-4 py-3 text-right">
                        {o.items.reduce((sum, i) => sum + i.quantity, 0)}
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
        </section>
      </div>
    </div>
  );
}