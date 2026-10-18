"use client";

import { useState } from "react";
import { Product } from "@/types";
import { useCart } from "@/store/cart";

export default function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function handleClick() {
    // variant thakle default hishebe prothom-ta
    addItem(product, product.variants?.[0], 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button
      onClick={handleClick}
      disabled={!product.inStock}
      className="mt-3 rounded-lg bg-pink-600 py-2 text-sm font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {!product.inStock ? "Out of Stock" : added ? "Added ✓" : "Add to Cart"}
    </button>
  );
}