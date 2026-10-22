import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProductListing from "@/components/product/ProductListing";
import { getProductsByCategory } from "@/lib/products";
import { getCategoryBySlug } from "@/lib/categories";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <CategoryContent params={params} />
      </Suspense>
    </main>
  );
}

async function CategoryContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getProductsByCategory(slug);

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{category.name}</h1>
      <ProductListing products={products} />
    </>
  );
}