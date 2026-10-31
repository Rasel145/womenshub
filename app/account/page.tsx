import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AccountTabs from "@/components/account/AccountTabs";

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">My Account</h1>
        <Link
          href="/account/security"
          className="text-sm font-medium text-pink-600 hover:underline"
        >
          Password and security
        </Link>
      </div>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <AccountContent />
      </Suspense>
    </main>
  );
}

async function AccountContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <>
      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="mb-6 flex items-center justify-between rounded-xl border border-pink-200 bg-pink-50 p-4 text-sm"
        >
          <span>
            <span className="block font-semibold text-pink-700">You are an admin</span>
            <span className="text-gray-600">Manage orders and products</span>
          </span>
          <span className="font-medium text-pink-700">Open admin panel →</span>
        </Link>
      )}

      <AccountTabs
        user={{ name: user.name, phone: user.phone, email: user.email }}
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          date: o.createdAt.toISOString().slice(0, 10),
          total: o.total,
          status: o.status,
          itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
        }))}
      />
    </>
  );
}