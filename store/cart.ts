import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

export interface CartItem {
  key: string; // productId + variant, jate ekoi product-er alada variant alada item hoy
  product: Product;
  variant?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, variant?: string, quantity?: number) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (product, variant, quantity = 1) =>
        set((state) => {
          const key = `${product.id}-${variant ?? "default"}`;
          const existing = state.items.find((i) => i.key === key);

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { key, product, variant, quantity }] };
        }),

      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

      updateQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),
    }),
    { name: "womenshub-cart" } // localStorage key, refresh korleo cart thakbe
  )
);