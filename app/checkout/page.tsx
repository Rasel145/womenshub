"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { DeliveryArea, getDeliveryCharge, DELIVERY_CHARGE } from "@/lib/delivery";

type PaymentMethod = "cod" | "bkash" | "nagad";

interface FormState {
  name: string;
  phone: string;
  address: string;
  city: string;
  note: string;
}

const paymentOptions: { key: PaymentMethod; label: string; hint: string }[] = [
  { key: "cod", label: "Cash on Delivery", hint: "Product haate peye taka din" },
  { key: "bkash", label: "bKash", hint: "Online payment (pore connect hobe)" },
  { key: "nagad", label: "Nagad", hint: "Online payment (pore connect hobe)" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();

  const [mounted, setMounted] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [area, setArea] = useState<DeliveryArea>("dhaka");
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    address: "",
    city: "",
    note: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => setMounted(true), []);

  if (!mounted || placed) {
    return <main className="mx-auto w-full max-w-6xl px-4 py-6">Loading...</main>;
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Cart khali</h1>
        <p className="mb-6 text-gray-500">Checkout korar age kichu product add korun.</p>
        <Link
          href="/products"
          className="rounded-lg bg-pink-600 px-6 py-3 font-medium text-white hover:bg-pink-700"
        >
          Shopping shuru korun
        </Link>
      </main>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const delivery = getDeliveryCharge(subtotal, area);
  const total = subtotal + delivery;

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 3) next.name = "Pura nam likhun";
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim()))
      next.phone = "Shothik mobile number din (jemon 01712345678)";
    if (form.address.trim().length < 10) next.address = "Puro thikana likhun";
    if (form.city.trim().length < 2) next.city = "Jela/shohor likhun";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // Pore ekhane backend API call hobe. Ekhon fake order ID toiri kori.
    const orderId = `WH-${Date.now().toString().slice(-6)}`;

    setPlaced(true);
    clearCart();
    router.push(`/order-success?id=${orderId}`);
  }

  const inputClass = (field: keyof FormState) =>
    clsx(
      "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500",
      errors[field] && "border-red-500"
    );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <form
        onSubmit={handlePlaceOrder}
        className="grid gap-6 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-6">
          {/* Delivery info */}
          <section className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Delivery Information</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Pura nam</label>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className={inputClass("name")}
                  placeholder="Nusrat Jahan"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Mobile number</label>
                <input
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={inputClass("phone")}
                  placeholder="01712345678"
                  inputMode="numeric"
                  maxLength={11}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium">Puro thikana</label>
              <textarea
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                className={inputClass("address")}
                rows={3}
                placeholder="Bari/flat, road, area"
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-600">{errors.address}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium">Jela / Shohor</label>
              <input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className={inputClass("city")}
                placeholder="Dhaka"
              />
              {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium">
                Note (optional)
              </label>
              <input
                value={form.note}
                onChange={(e) => update("note", e.target.value)}
                className={inputClass("note")}
                placeholder="Delivery-r jonno kono bishesh nirdesh"
              />
            </div>
          </section>

          {/* Delivery area */}
          <section className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Delivery Area</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["dhaka", "outside"] as DeliveryArea[]).map((key) => (
                <label
                  key={key}
                  className={clsx(
                    "flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm",
                    area === key && "border-pink-600 bg-pink-50"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="area"
                      checked={area === key}
                      onChange={() => setArea(key)}
                      className="accent-pink-600"
                    />
                    {key === "dhaka" ? "Dhaka-r bhitore" : "Dhaka-r baire"}
                  </span>
                  <span className="text-gray-500">
                    {formatPrice(DELIVERY_CHARGE[key])}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Payment Method</h2>
            <div className="space-y-3">
              {paymentOptions.map((opt) => (
                <label
                  key={opt.key}
                  className={clsx(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm",
                    payment === opt.key && "border-pink-600 bg-pink-50"
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === opt.key}
                    onChange={() => setPayment(opt.key)}
                    className="mt-0.5 accent-pink-600"
                  />
                  <span>
                    <span className="block font-medium">{opt.label}</span>
                    <span className="text-xs text-gray-500">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold">Order Summary</h2>

          <ul className="mb-4 space-y-3 border-b pb-4 text-sm">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between gap-3">
                <span className="text-gray-600">
                  {item.product.name}
                  {item.variant && ` (${item.variant})`} × {item.quantity}
                </span>
                <span className="shrink-0">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Delivery</dt>
              <dd>{delivery === 0 ? "Free" : formatPrice(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="text-pink-600">{formatPrice(total)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            className="mt-5 w-full rounded-lg bg-pink-600 py-3 font-medium text-white transition hover:bg-pink-700"
          >
            Place Order
          </button>

          <Link
            href="/cart"
            className="mt-3 block text-center text-sm text-gray-500 hover:text-pink-600"
          >
            Cart-e phire jan
          </Link>
        </aside>
      </form>
    </main>
  );
}