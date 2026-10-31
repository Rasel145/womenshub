import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/order-status";
import { AddBlockForm, UnblockButton } from "@/components/admin/BlocklistControls";

export default function BlockedPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <BlockedContent />
    </Suspense>
  );
}

async function BlockedContent() {
  await requireAdmin();

  const blocked = await prisma.blockedPhone.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Blocked numbers</h1>
      <p className="mb-6 text-sm text-gray-500">
        These mobile numbers cannot place orders. The customer only sees a general message
        and is never told that the number is on this list.
      </p>

      <AddBlockForm />

      {blocked.length === 0 ? (
        <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
          No blocked numbers.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Mobile number</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Blocked on</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {blocked.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{b.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{b.reason ?? "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {formatDateTime(b.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <UnblockButton id={b.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}