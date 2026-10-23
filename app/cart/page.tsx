"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { FREE_DELIVERY_OVER, DELIVERY_CHARGE } from "@/lib/delivery";
import T from "@/components/i18n/T";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { items, updateQuantity, removeItem, clearCart } = useCart();

  if (!mounted) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <T>Loading...</T>
      </main>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const delivery =
    subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_CHARGE.dhaka;
  const total = subtotal + delivery;

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">
          <T>Your cart is empty</T>
        </h1>
        <p className="mb-6 text-gray-500">
          <T>Add some products to get started.</T>
        </p>
        <Link
          href="/products"
          className="rounded-lg bg-pink-600 px-6 py-3 font-medium text-white hover:bg-pink-700"
        >
          <T>Start Shopping</T>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          <T>Shopping Cart</T>
        </h1>
        <button onClick={clearCart} className="text-sm text-red-600">
          <T>Clear cart</T>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 rounded-xl border bg-white p-4">
              <Link
                href={`/products/${item.product.slug}`}
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-pink-50 text-2xl font-bold text-pink-300"
              >
                {item.product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  item.product.brand[0]
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="text-xs text-gray-500">{item.product.brand}</p>
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="text-sm font-medium"
                  >
                    {item.product.name}
                  </Link>
                  {item.variant && (
                    <p className="text-xs text-gray-500">
                      <T>Option:</T> {item.variant}
                    </p>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border">
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      className="p-2"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      className="p-2"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-pink-600">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.key)}
                      className="text-gray-400 hover:text-red-600"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold">
            <T>Order Summary</T>
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">
                <T>Subtotal</T>
              </dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">
                <T>Delivery</T>
              </dt>
              <dd>{delivery === 0 ? <T>Free</T> : formatPrice(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-semibold">
              <dt>
                <T>Total</T>
              </dt>
              <dd className="text-pink-600">{formatPrice(total)}</dd>
            </div>
          </dl>

          {delivery > 0 && (
            <p className="mt-3 text-xs text-gray-500">
            <T vars={{ amount: formatPrice(FREE_DELIVERY_OVER - subtotal) }}>
            {"Add {amount} more to get free delivery."}
            </T>
            </p>
          )}

          <Link
            href="/checkout"
            className="mt-5 block rounded-lg bg-pink-600 py-3 text-center font-medium text-white hover:bg-pink-700"
          >
            <T>Proceed to Checkout</T>
          </Link>
        </aside>
      </div>
    </main>
  );
}