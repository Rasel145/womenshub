import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { formatDateTime } from "@/lib/order-status";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ q?: string; page?: string }>;

export default function AdminCustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <CustomersContent searchParams={searchParams} />
    </Suspense>
  );
}

function buildHref(params: { q?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin/customers?${qs}` : "/admin/customers";
}

async function CustomersContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 50);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    role: "CUSTOMER" as const,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q } },
        { email: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      // Never select passwordHash
      select: { id: true, name: true, phone: true, email: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  // Order count and total spent for the customers on this page (cancelled orders are not counted)
  const stats = users.length
    ? await prisma.order.groupBy({
        by: ["userId"],
        where: { userId: { in: users.map((u) => u.id) }, status: { not: "CANCELLED" } },
        _sum: { total: true },
        _count: { _all: true },
      })
    : [];
  const byUser = new Map(
    stats.map((s) => [s.userId, { orders: s._count._all, spent: s._sum.total ?? 0 }])
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Customers</h1>

      <form action="/admin/customers" method="get" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, mobile number or email"
          className="w-full max-w-sm rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
        >
          Search
        </button>
      </form>

      {users.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          No customers found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 text-right font-medium">Orders</th>
                <th className="px-4 py-3 text-right font-medium">Total spent</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const s = byUser.get(u.id);
                return (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${u.id}`}
                        className="font-medium text-pink-600"
                      >
                        {u.name}
                      </Link>
                      <p className="text-xs text-gray-500">{u.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email ?? "-"}</td>
                    <td className="px-4 py-3 text-right">{s?.orders ?? 0}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatPrice(s?.spent ?? 0)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatDateTime(u.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Orders and total spent do not include cancelled orders, or orders placed without
        logging in.
      </p>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Page {page} of {totalPages} · {total} customers
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ q, page: page - 1 })}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ q, page: page + 1 })}
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