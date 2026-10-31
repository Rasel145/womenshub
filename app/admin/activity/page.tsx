import { Suspense } from "react";
import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/order-status";

const PAGE_SIZE = 50;

const GROUPS: { key: string; label: string; prefix?: string }[] = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders", prefix: "order." },
  { key: "products", label: "Products", prefix: "product." },
  { key: "categories", label: "Categories", prefix: "category." },
  { key: "reviews", label: "Reviews", prefix: "review." },
  { key: "blocklist", label: "Blocked numbers", prefix: "phone." },
  { key: "reports", label: "Reports", prefix: "report." },
  { key: "security", label: "Security", prefix: "security." },
];

const LABEL: Record<string, string> = {
  "order.status": "Changed order status",
  "order.shipping": "Updated courier info",
  "order.event": "Added a timeline update",
  "order.edit": "Edited customer details",
  "order.note": "Saved an internal note",
  "order.expire": "Cancelled old pending orders",
  "product.create": "Added a product",
  "product.update": "Updated a product",
  "category.create": "Added a category",
  "category.update": "Updated a category",
  "category.delete": "Deleted a category",
  "review.hide": "Hid a review",
  "review.show": "Showed a review",
  "review.delete": "Deleted a review",
  "phone.block": "Blocked a number",
  "phone.unblock": "Unblocked a number",
  "report.export": "Downloaded a report",
  "security.password": "Changed own password",
  "security.sessions": "Signed out other devices",
};

function targetLink(type: string | null, id: string | null) {
  if (!type || !id) return null;
  if (type === "Order") return `/admin/orders/${id}`;
  if (type === "Product") return `/admin/products/${id}/edit`;
  if (type === "Category") return `/admin/categories/${id}/edit`;
  return null;
}

type SearchParams = Promise<{ group?: string; page?: string }>;

export default function ActivityPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <ActivityContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ActivityContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const group = GROUPS.find((g) => g.key === sp.group) ?? GROUPS[0];
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = group.prefix ? { action: { startsWith: group.prefix } } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (key: string, p = 1) =>
    `/admin/activity?group=${key}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Activity log</h1>
      <p className="mb-6 text-sm text-gray-500">
        Who changed what in the admin panel, and when. Passwords and customers&apos; personal
        data are never written here.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <Link
            key={g.key}
            href={href(g.key)}
            className={clsx(
              "rounded-full px-3 py-1 text-sm",
              g.key === group.key ? "bg-pink-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            {g.label}
          </Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          No activity yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Who</th>
                <th className="px-4 py-3 font-medium">What</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">IP address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => {
                const link = targetLink(l.targetType, l.targetId);

                return (
                  <tr key={l.id} className="border-b align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatDateTime(l.createdAt)}
                    </td>
                    <td className="px-4 py-3">{l.user?.name ?? "Deleted user"}</td>
                    <td className="px-4 py-3">
                      {link ? (
                        <Link href={link} className="text-pink-600 hover:underline">
                          {LABEL[l.action] ?? l.action}
                        </Link>
                      ) : (
                        (LABEL[l.action] ?? l.action)
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.details ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{l.ip ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Page {page} of {totalPages} · {total} entries
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={href(group.key, page - 1)}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={href(group.key, page + 1)}
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