import { Truck, Wallet, PackageCheck } from "lucide-react";
import T from "@/components/i18n/T";
import { formatPrice } from "@/lib/utils";
import { FREE_DELIVERY_OVER } from "@/lib/delivery";

export default function TrustStrip() {
  const items = [
    {
      icon: Truck,
      title: "Free Delivery",
      text: "On orders over {amount}",
      vars: { amount: formatPrice(FREE_DELIVERY_OVER) },
    },
    {
      icon: Wallet,
      title: "Cash on Delivery",
      text: "Pay when you receive your order",
      vars: undefined,
    },
    {
      icon: PackageCheck,
      title: "Track Your Orders",
      text: "See the status of every order in your account",
      vars: undefined,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {items.map(({ icon: Icon, title, text, vars }) => (
        <div key={title} className="flex items-center gap-3 rounded-xl border bg-white p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600">
            <Icon size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold">
              <T>{title}</T>
            </p>
            <p className="text-xs text-gray-500">
              <T vars={vars}>{text}</T>
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}