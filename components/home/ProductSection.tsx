import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import T from "@/components/i18n/T";
import type { Product } from "@/types";

// A titled row of product cards. Shows nothing when there are no products.
export default function ProductSection({
  title,
  href,
  products,
}: {
  title: string;
  href?: string;
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          <T>{title}</T>
        </h2>
        {href && (
          <Link href={href} className="text-sm font-medium text-pink-600 hover:underline">
            <T>View all</T>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}