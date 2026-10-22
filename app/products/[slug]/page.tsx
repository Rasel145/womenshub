import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/product/ProductDetail";
import ProductReviews from "@/components/product/ProductReviews";
import { getProductBySlug } from "@/lib/products";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <ProductContent params={params} />
      </Suspense>
    </main>
  );
}

async function ProductContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <>
      <ProductDetail product={product} />

      {/* Reviews load separately, so the product shows first */}
      <Suspense
        fallback={<p className="mt-12 text-sm text-gray-500">Loading reviews...</p>}
      >
        <ProductReviews productId={product.id} />
      </Suspense>
    </>
  );
}