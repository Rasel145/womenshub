"use client";
import { useCart } from "@/store/cart";
import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Star, Minus, Plus, Heart } from "lucide-react";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";


export default function ProductDetail({ product }: { product: Product }) {
  const [variant, setVariant] = useState(product.variants?.[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  // Pore real image URL diye replace hobe
  const images = [0, 1, 2, 3];
const addItem = useCart((s) => s.addItem);


  function handleAddToCart() {
  addItem(product, variant, quantity);
  setQuantity(1);
}

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 text-xs text-gray-500">
        <Link href="/">Home</Link> /{" "}
        <Link href={`/category/${product.category}`} className="capitalize">
          {product.category.replace(/-/g, " ")}
        </Link>{" "}
        / <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative flex aspect-square items-center justify-center rounded-xl bg-pink-50 text-8xl font-bold text-pink-300">
            {product.brand[0]}
            {discount > 0 && (
              <span className="absolute left-3 top-3 rounded bg-pink-600 px-2 py-1 text-sm font-medium text-white">
                -{discount}%
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {images.map((i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={clsx(
                  "flex aspect-square items-center justify-center rounded-lg border-2 bg-pink-50 text-xl font-bold text-pink-300",
                  activeImage === i ? "border-pink-600" : "border-transparent"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-gray-500">{product.brand}</p>
          <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>

          <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{product.rating}</span>
            <span>({product.reviewCount} reviews)</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-pink-600">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>

          <p
            className={clsx(
              "mt-2 text-sm font-medium",
              product.inStock ? "text-green-600" : "text-red-600"
            )}
          >
            {product.inStock ? "In Stock" : "Out of Stock"}
          </p>

          {/* Variants */}
          {product.variants && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-medium">
                Option: <span className="text-gray-500">{variant}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariant(v)}
                    className={clsx(
                      "rounded-lg border px-4 py-2 text-sm transition",
                      variant === v
                        ? "border-pink-600 bg-pink-50 text-pink-700"
                        : "hover:border-gray-400"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-lg border">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-sm font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-3"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 rounded-lg bg-pink-600 py-3 font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {product.inStock ? "Add to Cart" : "Out of Stock"}
            </button>

            <button
              className="rounded-lg border p-3 hover:bg-gray-50"
              aria-label="Add to wishlist"
            >
              <Heart size={20} />
            </button>
          </div>

          {/* Description */}
          <div className="mt-8 border-t pt-5">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="text-sm leading-relaxed text-gray-600">
              {product.description ?? "Ei product-er description shigghroi add kora hobe."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}