"use client";

import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { Product } from "@/types";

type Sort = "default" | "price-asc" | "price-desc" | "rating";

export default function ProductListing({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<Sort>("default");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(3000);
  const [inStockOnly, setInStockOnly] = useState(false);

  const brands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const list = products.filter(
      (p) =>
        (selectedBrands.length === 0 || selectedBrands.includes(p.brand)) &&
        p.price <= maxPrice &&
        (!inStockOnly || p.inStock)
    );

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [products, selectedBrands, maxPrice, inStockOnly, sort]);

  function toggleBrand(brand: string) {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  }

  function resetFilters() {
    setSelectedBrands([]);
    setMaxPrice(3000);
    setInStockOnly(false);
    setSort("default");
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Filters */}
      <aside className="space-y-5 rounded-xl border bg-white p-4 text-sm md:w-60 md:self-start">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Filters</h2>
          <button onClick={resetFilters} className="text-xs text-pink-600">
            Reset
          </button>
        </div>

        <div>
          <h3 className="mb-2 font-medium">Brand</h3>
          <ul className="space-y-1.5">
            {brands.map((brand) => (
              <li key={brand}>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="accent-pink-600"
                  />
                  {brand}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 font-medium">
            Max price: ৳{maxPrice.toLocaleString()}
          </h3>
          <input
            type="range"
            min={200}
            max={3000}
            step={100}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-pink-600"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-pink-600"
          />
          In stock only
        </label>
      </aside>

      {/* Results */}
      <section className="flex-1">
        <div className="mb-4 flex items-center justify-between text-sm">
          <p className="text-gray-500">{filtered.length} products</p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg border bg-white px-3 py-1.5 outline-none focus:border-pink-500"
          >
            <option value="default">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-xl border p-8 text-center text-gray-500">
            Kono product pawa jay ni. Filter change kore dekhun.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}