import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import ProductListing from "@/components/product/ProductListing";
import { searchProducts } from "@/lib/products";

type SearchParams = Promise<{ q?: string }>;

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <Suspense fallback={<p className="text-gray-500">Searching...</p>}>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SearchContent({ searchParams }: { searchParams: SearchParams }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 50);
  const tooShort = query.length > 0 && query.length < 2;
  const products = query.length >= 2 ? await searchProducts(query) : [];

  return (
    <div>
      {/* Search box (also used on mobile, where the header has no search bar) */}
      <form action="/search" method="get" role="search" className="mb-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          maxLength={50}
          placeholder="Search products, brands..."
          className="w-full max-w-xl rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-pink-500"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-pink-700"
        >
          <Search size={16} />
          Search
        </button>
      </form>

      {query.length === 0 && (
        <p className="text-gray-500">Type a product name, brand or category to search.</p>
      )}

      {tooShort && (
        <p className="text-gray-500">Please type at least 2 characters.</p>
      )}

      {query.length >= 2 && (
        <>
          <h1 className="mb-6 text-xl font-bold">
            {products.length} {products.length === 1 ? "result" : "results"} for &quot;
            {query}&quot;
          </h1>

          {products.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
              <p className="mb-3">No products found. Try a different word, or browse:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  ["skincare", "Skincare"],
                  ["makeup", "Makeup"],
                  ["haircare", "Haircare"],
                  ["fragrance", "Fragrance"],
                  ["bath-body", "Bath & Body"],
                ].map(([slug, label]) => (
                  <Link
                    key={slug}
                    href={`/category/${slug}`}
                    className="rounded-full bg-gray-100 px-3 py-1 hover:bg-pink-100 hover:text-pink-700"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <ProductListing products={products} />
          )}
        </>
      )}
    </div>
  );
}