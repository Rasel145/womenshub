import ProductListing from "@/components/product/ProductListing";
import { products } from "@/data/products";

export default function ProductsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">All Products</h1>
      <ProductListing products={products} />
    </main>
  );
}