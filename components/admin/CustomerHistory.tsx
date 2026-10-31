import { prisma } from "@/lib/prisma";
import { STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { BlockPhoneButton } from "./BlocklistControls";

export default async function CustomerHistory({
  phone,
  orderId,
}: {
  phone: string;
  orderId: string;
}) {
  const [groups, blocked] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where: { phone, NOT: { id: orderId } },
      _count: { _all: true },
    }),
    prisma.blockedPhone.findUnique({ where: { phone }, select: { reason: true } }),
  ]);

  const total = groups.reduce((sum, g) => sum + g._count._all, 0);
  const cancelled = groups.find((g) => g.status === "CANCELLED")?._count._all ?? 0;
  // Three or more earlier orders and at least half of them cancelled
  const risky = total >= 3 && cancelled / total >= 0.5;

  return (
    <div>
      <h2 className="mb-2 font-semibold">This mobile number</h2>

      {total === 0 ? (
        <p className="text-gray-500">No other orders from this number.</p>
      ) : (
        <>
          <p className="text-gray-600">{total} other {total === 1 ? "order" : "orders"}:</p>
          <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
            {groups.map((g) => (
              <li key={g.status}>
                {STATUS_LABEL[g.status as OrderStatus]}: {g._count._all}
              </li>
            ))}
          </ul>
        </>
      )}

      {risky && (
        <p className="mt-3 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-800">
          Many earlier orders from this number were cancelled. Please confirm by phone before
          shipping.
        </p>
      )}

      <div className="mt-3">
        {blocked ? (
          <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
            This number is blocked{blocked.reason ? `: ${blocked.reason}` : "."}
          </p>
        ) : (
          <BlockPhoneButton phone={phone} />
        )}
      </div>
    </div>
  );
}