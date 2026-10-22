import { Suspense } from "react";
import ProductCard from "@/components/product/ProductCard";
import { getLatestProducts } from "@/lib/products";
import T from "@/components/i18n/T";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h2 className="mb-4 text-xl font-bold">
        <T>Latest Products</T>
      </h2>
      <Suspense
        fallback={
          <p className="text-gray-500">
            <T>Loading products...</T>
          </p>
        }
      >
        <LatestProducts />
      </Suspense>
    </main>
  );
}

async function LatestProducts() {
  const products = await getLatestProducts(8);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}