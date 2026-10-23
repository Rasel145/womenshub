import { Suspense } from "react";
import Hero from "@/components/home/Hero";
import TrustStrip from "@/components/home/TrustStrip";
import CategoryTiles from "@/components/home/CategoryTiles";
import ProductSection from "@/components/home/ProductSection";
import {
  getLatestProducts,
  getBestSellerProducts,
  getTopRatedProducts,
} from "@/lib/products";

export default function Home() {
  return (
    <main>
      <Hero />

      <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-8">
        <TrustStrip />

        <Suspense fallback={null}>
          <CategoryTiles />
        </Suspense>

        <Suspense fallback={<div className="h-64" />}>
          <NewArrivals />
        </Suspense>

        <Suspense fallback={null}>
          <Popular />
        </Suspense>

        <Suspense fallback={null}>
          <TopRated />
        </Suspense>
      </div>
    </main>
  );
}

async function NewArrivals() {
  const products = await getLatestProducts(8);
  return <ProductSection title="New Arrivals" href="/products" products={products} />;
}

async function Popular() {
  const products = await getBestSellerProducts(4);
  return <ProductSection title="Popular Right Now" products={products} />;
}

async function TopRated() {
  const products = await getTopRatedProducts(4);
  return <ProductSection title="Top Rated" products={products} />;
}