"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { User as UserIcon, Package, LogOut } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";
import { ageFromIsoDate, genderLabel } from "@/lib/profile";

type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface AccountOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: OrderStatus;
  itemCount: number;
}

interface Props {
  user: {
    name: string;
    phone: string;
    email: string | null;
    gender: string | null;
    dateOfBirth: string | null; // "2000-05-17"
    avatarUrl: string | null;
  };
  orders: AccountOrder[];
}

type Tab = "profile" | "orders";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "orders", label: "Orders", icon: Package },
];

const statusStyle: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AccountTabs({ user, orders }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const age = user.dateOfBirth ? ageFromIsoDate(user.dateOfBirth) : null;
  const gender = genderLabel(user.gender);

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className="md:w-60">
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={clsx(
                "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition",
                activeTab === key
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              Logout
            </button>
          </form>
        </nav>
      </aside>

      <section className="flex-1 rounded-xl border bg-white p-5">
        {activeTab === "profile" && (
          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Profile</h2>
              <Link
                href="/account/profile"
                className="rounded-lg border px-3 py-1.5 text-sm font-medium text-pink-600 hover:bg-pink-50"
              >
                Edit profile
              </Link>
            </div>

            <div className="mb-6 flex items-center gap-4">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt="Your profile photo"
                  className="h-20 w-20 rounded-full border object-cover"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-50 text-2xl font-bold text-pink-600">
                  {user.name.trim()[0]?.toUpperCase() ?? "?"}
                </span>
              )}
              <p className="text-lg font-semibold">{user.name}</p>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Mobile number</dt>
                <dd className="font-medium">{user.phone}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium">{user.email ?? "Not added"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Gender</dt>
                <dd className="font-medium">{gender ?? "Not added"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Age</dt>
                <dd className="font-medium">{age !== null && age >= 0 ? age : "Not added"}</dd>
              </div>
            </dl>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold">My Orders</h2>

            {orders.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                <p className="mb-3">You have not placed any orders yet.</p>
                <Link href="/products" className="font-medium text-pink-600">
                  Start shopping
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">
                        {order.date} · {order.itemCount}{" "}
                        {order.itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(order.total)}</p>
                      <span
                        className={clsx(
                          "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          statusStyle[order.status]
                        )}
                      >
                        {order.status.toLowerCase()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}