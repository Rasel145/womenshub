import Link from "next/link";
import { Star } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  const image = product.images?.[0];

  return (
    <div className="group relative flex flex-col rounded-xl border bg-white p-3 transition hover:shadow-md">
      <WishlistButton productId={product.id} variant="card" />

      <Link href={`/products/${product.slug}`}>
        <div className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-pink-50 text-4xl font-bold text-pink-300">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            product.brand[0]
          )}
          {discount > 0 && (
            <span className="absolute left-2 top-2 rounded bg-pink-600 px-1.5 py-0.5 text-xs font-medium text-white">
              -{discount}%
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500">{product.brand}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-10 text-sm font-medium">
          {product.name}
        </h3>
      </Link>

      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
        <Star size={14} className="fill-yellow-400 text-yellow-400" />
        <span>{product.rating}</span>
        <span>({product.reviewCount})</span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-semibold text-pink-600">
          {formatPrice(product.price)}
        </span>
        {product.oldPrice && (
          <span className="text-xs text-gray-400 line-through">
            {formatPrice(product.oldPrice)}
          </span>
        )}
      </div>

      <AddToCartButton product={product} />
    </div>
  );
}