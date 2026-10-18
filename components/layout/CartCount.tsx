"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";

export default function CartCount() {
  const [mounted, setMounted] = useState(false);
  const count = useCart((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  useEffect(() => setMounted(true), []);

  return (
    <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[10px] text-white">
      {mounted ? count : 0}
    </span>
  );
}