import { Truck, Wallet, PackageCheck, type LucideIcon } from "lucide-react";
import T from "@/components/i18n/T";
import { business as b } from "@/lib/business";

type Item = {
  icon: LucideIcon;
  title: string;
  text: string;
  vars?: Record<string, string | number>;
};

export default function TrustStrip() {
  const d = b.deliveryDaysDhaka;

  const items: Item[] = [
    {
      icon: Truck,
      title: "Fast Delivery",
      text: "{min} to {max} working days inside Dhaka",
      vars: { min: d.min, max: d.max },
    },
    {
      icon: Wallet,
      title: "Cash on Delivery",
      text: "Pay when you receive your order",
    },
    {
      icon: PackageCheck,
      title: "Track Your Orders",
      text: "See the status of every order in your account",
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