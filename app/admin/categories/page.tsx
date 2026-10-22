import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import DeleteCategoryButton from "@/components/admin/DeleteCategoryButton";

export default function AdminCategoriesPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <CategoriesContent />
    </Suspense>
  );
}

async function CategoriesContent() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-1 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
        >
          <Plus size={16} />
          Add category
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          No categories yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 text-right font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{c.position}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/categories/${c.id}/edit`}
                      className="font-medium text-pink-600"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">/category/{c.slug}</td>
                  <td className="px-4 py-3 text-right">{c._count.products}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex items-center gap-4">
                      <Link href={`/category/${c.slug}`} className="text-gray-600 hover:underline">
                        View
                      </Link>
                      <Link
                        href={`/admin/categories/${c.id}/edit`}
                        className="text-gray-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteCategoryButton
                        id={c.id}
                        name={c.name}
                        productCount={c._count.products}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Only categories with no products can be deleted. Hidden products are counted too.
      </p>
    </div>
  );
}