import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAdminCounts } from "@/lib/admin-counts";
import AdminNav from "@/components/admin/AdminNav";
import AdminCountsProvider from "@/components/admin/AdminCounts";
import OrderAlerts from "@/components/admin/OrderAlerts";

export const metadata: Metadata = {
  title: "Admin | WomensHub",
  robots: { index: false, follow: false },
};

// The admin area always depends on who is logged in, so it is rendered per request
export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <p className="mx-auto w-full max-w-6xl px-4 py-6 text-gray-500">Loading...</p>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const counts = await getAdminCounts();

  return (
    <AdminCountsProvider initial={counts}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row">
        <AdminNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <OrderAlerts />
    </AdminCountsProvider>
  );
}