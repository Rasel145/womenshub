import { Suspense } from "react";
import ProductListing from "@/components/product/ProductListing";
import { getProducts } from "@/lib/products";

export default function ProductsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">All Products</h1>
      <Suspense fallback={<p className="text-gray-500">Loading products...</p>}>
        <AllProducts />
      </Suspense>
    </main>
  );
}

async function AllProducts() {
  const products = await getProducts();
  return <ProductListing products={products} />;
}