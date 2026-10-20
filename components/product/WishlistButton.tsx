"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import clsx from "clsx";
import { useWishlist } from "@/store/wishlist";

export default function WishlistButton({
  productId,
  variant,
}: {
  productId: string;
  variant: "card" | "detail";
}) {
  const router = useRouter();
  const acquire = useWishlist((s) => s.acquire);
  const release = useWishlist((s) => s.release);
  const toggle = useWishlist((s) => s.toggle);
  const active = useWishlist((s) => s.ids.includes(productId));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    acquire();
    return () => release();
  }, [acquire, release]);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    const result = await toggle(productId);
    setBusy(false);

    // Not logged in: send the customer to the login page
    if (result === "login") router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={clsx(
        variant === "card"
          ? "absolute right-5 top-5 z-10 rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
          : "rounded-lg border p-3 hover:bg-gray-50"
      )}
    >
      <Heart
        size={variant === "card" ? 18 : 20}
        className={clsx(active ? "fill-pink-600 text-pink-600" : "text-gray-600")}
      />
    </button>
  );
}