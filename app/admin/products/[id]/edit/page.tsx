import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import ProductForm from "@/components/admin/ProductForm";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <EditProductContent params={params} />
    </Suspense>
  );
}

async function EditProductContent({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { brand: true } }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600"
      >
        <ArrowLeft size={16} />
        All products
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Edit product</h1>
        {product.isActive && (
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-sm text-pink-600"
          >
            View in store
            <ExternalLink size={14} />
          </Link>
        )}
      </div>

      <ProductForm
        mode="edit"
        productId={product.id}
        categories={categories}
        brandNames={brands.map((b) => b.name)}
        initial={{
          name: product.name,
          slug: product.slug,
          brand: product.brand.name,
          categoryId: product.categoryId,
          price: product.price,
          oldPrice: product.oldPrice,
          stock: product.stock,
          description: product.description ?? "",
          variants: product.variants,
          images: product.images,
          isActive: product.isActive,
        }}
      />
    </div>
  );
}