import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <NewProductContent />
    </Suspense>
  );
}

async function NewProductContent() {
  await requireAdmin();

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600"
      >
        <ArrowLeft size={16} />
        All products
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Add product</h1>

      <ProductForm
        mode="create"
        categories={categories}
        brandNames={brands.map((b) => b.name)}
      />
    </div>
  );
}