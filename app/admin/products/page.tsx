import { Suspense } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";

const PAGE_SIZE = 20;
const LOW_STOCK = 5;

type SearchParams = Promise<{ q?: string; show?: string; page?: string }>;

export default function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  );
}

function buildHref(params: { q?: string; show?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.show && params.show !== "all") sp.set("show", params.show);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

async function ProductsContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const show = sp.show === "active" || sp.show === "hidden" ? sp.show : "all";
  const q = (sp.q ?? "").trim().slice(0, 50);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(show === "active" && { isActive: true }),
    ...(show === "hidden" && { isActive: false }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { brand: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { brand: true, category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filters = [
    { key: "all", label: "All" },
    { key: "active", label: "Visible" },
    { key: "hidden", label: "Hidden" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
        >
          <Plus size={16} />
          Add product
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={buildHref({ q, show: f.key })}
            className={clsx(
              "rounded-full px-3 py-1 text-sm",
              show === f.key ? "bg-pink-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <form action="/admin/products" method="get" className="mb-4 flex gap-2">
        {show !== "all" && <input type="hidden" name="show" value={show} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search product name or brand"
          className="w-full max-w-sm rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
        >
          Search
        </button>
      </form>

      {products.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          No products found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-medium text-pink-600"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-gray-500">{p.brand.name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.category.name}</td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold">{formatPrice(p.price)}</p>
                    {p.oldPrice && (
                      <p className="text-xs text-gray-400 line-through">
                        {formatPrice(p.oldPrice)}
                      </p>
                    )}
                  </td>
                  <td
                    className={clsx(
                      "px-4 py-3 text-right font-medium",
                      p.stock === 0
                        ? "text-red-600"
                        : p.stock <= LOW_STOCK
                          ? "text-amber-600"
                          : "text-gray-700"
                    )}
                  >
                    {p.stock}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        p.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      )}
                    >
                      {p.isActive ? "Visible" : "Hidden"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Page {page} of {totalPages} · {total} products
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ q, show, page: page - 1 })}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ q, show, page: page + 1 })}
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