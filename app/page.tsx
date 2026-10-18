import { Suspense } from "react";
import ProductCard from "@/components/product/ProductCard";
import { getProducts } from "@/lib/products";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h2 className="mb-4 text-xl font-bold">Featured Products</h2>
      <Suspense fallback={<p className="text-gray-500">Loading products...</p>}>
        <FeaturedProducts />
      </Suspense>
    </main>
  );
}

async function FeaturedProducts() {
  const products = await getProducts();

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {products.slice(0, 8).map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}