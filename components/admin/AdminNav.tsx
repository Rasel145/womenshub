"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Users,
  MessageSquare,
  TrendingUp,
  Ban,
  History,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { useAdminCounts } from "./AdminCounts";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { href: "/admin/reports", label: "Reports", icon: TrendingUp, exact: false },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/categories", label: "Categories", icon: Tags, exact: false },
  { href: "/admin/customers", label: "Customers", icon: Users, exact: false },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare, exact: false },
  { href: "/admin/blocked", label: "Blocked numbers", icon: Ban, exact: false },
  { href: "/admin/activity", label: "Activity log", icon: History, exact: false },
  { href: "/account/security", label: "My security", icon: KeyRound, exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();
  const { pending, unseen } = useAdminCounts();

  return (
    <aside className="admin-nav md:w-52">
      <nav className="flex gap-2 overflow-x-auto md:flex-col">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const badge = href === "/admin/orders" ? pending : 0;

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
              {badge > 0 && (
                <span
                  className={clsx(
                    "ml-auto rounded-full px-2 py-0.5 text-xs font-semibold",
                    active ? "bg-white text-pink-600" : "bg-pink-600 text-white",
                    unseen > 0 && "animate-pulse"
                  )}
                  style={active ? { backgroundColor: "#ffffff" } : undefined}
                >
                  {badge}
                </span>
              )}
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