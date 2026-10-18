import { Suspense } from "react";
import ProductListing from "@/components/product/ProductListing";
import { getProductsByCategory } from "@/lib/products";

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
  const products = await getProductsByCategory(slug);
  const title = slug.replace(/-/g, " ");

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold capitalize">{title}</h1>
      <ProductListing products={products} />
    </>
  );
}