"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  ArrowLeft,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/customers", label: "Customers", icon: Users, exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="md:w-52">
      <nav className="flex gap-2 overflow-x-auto md:flex-col">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        <Link
          href="/"
          className="flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-pink-600"
        >
          <ArrowLeft size={18} />
          Back to store
        </Link>
      </nav>
    </aside>
  );
}