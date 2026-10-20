import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AccountTabs from "@/components/account/AccountTabs";

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">My Account</h1>
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
  );
}