"use client";

import { useState } from "react";
import clsx from "clsx";
import { user, orders, addresses } from "@/data/account";
import { formatPrice } from "@/lib/utils";

type Tab = "profile" | "orders" | "addresses";



export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "orders", label: "Orders" },
    { key: "addresses", label: "Addresses" },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">My Account</h1>

      <nav className="mb-6 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-medium",
              activeTab === tab.key
                ? "bg-pink-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="rounded-xl border bg-white p-5">
        {activeTab === "profile" && (
          <div className="space-y-2 text-sm">
            <p><b>Name:</b> {user.name}</p>
            <p><b>Email:</b> {user.email}</p>
            <p><b>Phone:</b> {user.phone}</p>
          </div>
        )}

        {activeTab === "orders" && (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex justify-between rounded-lg border p-4 text-sm"
              >
                <div>
                  <p className="font-medium">#{order.id}</p>
                  <p className="text-gray-500">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(order.total)}</p>
                  <p className="capitalize text-gray-500">{order.status}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {activeTab === "addresses" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {addresses.map((addr) => (
              <div key={addr.id} className="rounded-lg border p-4 text-sm">
                <p className="font-semibold">
                  {addr.label} {addr.isDefault && "(Default)"}
                </p>
                <p>{addr.name}</p>
                <p className="text-gray-500">{addr.phone}</p>
                <p className="text-gray-500">{addr.details}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}