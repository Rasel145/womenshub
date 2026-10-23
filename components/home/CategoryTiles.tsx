import Link from "next/link";
import { getCategoriesWithCounts } from "@/lib/categories";
import T from "@/components/i18n/T";

export default async function CategoryTiles() {
  const categories = await getCategoriesWithCounts();
  if (categories.length === 0) return null;

  return (
    <section id="categories" className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-bold">
        <T>Shop by Category</T>
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((c) => {
          const count = c._count.products;

          return (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="flex flex-col items-center rounded-xl border bg-white p-4 text-center transition hover:border-pink-400 hover:shadow-md"
            >
              <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 text-xl font-bold text-pink-600">
                {c.name[0]}
              </span>
              <span className="text-sm font-medium">
                <T>{c.name}</T>
              </span>
              <span className="mt-0.5 text-xs text-gray-500">
                <T vars={{ count }}>
                  {count === 1 ? "{count} product" : "{count} products"}
                </T>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}