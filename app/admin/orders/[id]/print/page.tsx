import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { business as b } from "@/lib/business";
import PrintButton from "@/components/admin/PrintButton";
import { PAYMENT_LABEL, formatDateTime } from "@/lib/order-status";
import { registrationLine } from "@/lib/legal/contact";


export default function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <PrintContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PrintContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { type } = await searchParams;
  const packing = type === "packing";

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();

  const collect = order.paymentMethod === "COD" && order.status !== "DELIVERED";

  return (
    <div>
      {/* Hidden when printing */}
      <div className="print-hide mb-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600"
        >
          <ArrowLeft size={16} />
          Back to order
        </Link>
        <PrintButton />
        <Link
          href={`/admin/orders/${order.id}/print${packing ? "" : "?type=packing"}`}
          className="text-sm text-pink-600 underline"
        >
          Show {packing ? "invoice" : "packing slip"} instead
        </Link>
      </div>

      <div className="mx-auto max-w-[800px] rounded-xl border border-[#dddddd] bg-[#ffffff] p-8 text-[#111111]">
        <div className="flex flex-wrap justify-between gap-6 border-b border-[#dddddd] pb-5">
          {/* <div className="text-sm leading-relaxed">
            <p className="text-xl font-bold">{b.brand}</p>
            <p>{b.legalName}</p>
            <p>{b.address}</p>
            <p>
              {b.phone} · {b.email}
            </p>
            <p className="text-xs text-[#555555]">
              Trade License: {b.tradeLicense} · TIN: {b.tin}
              {b.bin ? ` · BIN: ${b.bin}` : ""}
            </p>
          </div> */}

                    <div className="text-sm leading-relaxed">
            <p className="text-xl font-bold">{b.brand}</p>
            {b.legalName.trim() && b.legalName !== b.brand && <p>{b.legalName}</p>}
            {b.address.trim() && <p>{b.address}</p>}
            {(b.phone.trim() || b.email.trim()) && (
              <p>{[b.phone.trim(), b.email.trim()].filter(Boolean).join(" · ")}</p>
            )}
            {registrationLine() && (
              <p className="text-xs text-[#555555]">{registrationLine()}</p>
            )}
          </div>
          <div className="text-right text-sm">
            <p className="text-2xl font-bold">{packing ? "PACKING SLIP" : "INVOICE"}</p>
            <p className="mt-1">Order #{order.orderNumber}</p>
            <p className="text-[#555555]">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>

        <div className="grid gap-6 py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-[#555555]">
              Deliver to
            </p>
            <p className="font-semibold">{order.name}</p>
            <p>{order.phone}</p>
            <p className="whitespace-pre-line">{order.address}</p>
            <p>{order.city}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-[#555555]">
              Payment and delivery
            </p>
            <p>{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</p>
            <p>{order.area === "DHAKA" ? "Inside Dhaka" : "Outside Dhaka"}</p>
            {order.courier && (
              <p>
                Courier: {order.courier}
                {order.trackingCode ? ` (${order.trackingCode})` : ""}
              </p>
            )}
          </div>
        </div>

        {collect && (
          <div className="mb-5 rounded-lg border-2 border-[#111111] p-3 text-center">
            <p className="text-xs uppercase text-[#555555]">Collect cash on delivery</p>
            <p className="text-2xl font-bold">{formatPrice(order.total)}</p>
          </div>
        )}

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#dddddd] text-xs uppercase text-[#555555]">
              <th className="py-2 pr-2 font-medium">Item</th>
              <th className="py-2 pr-2 font-medium">Option</th>
              {!packing && <th className="py-2 pr-2 text-right font-medium">Price</th>}
              <th className="py-2 pr-2 text-right font-medium">Qty</th>
              {!packing && <th className="py-2 text-right font-medium">Total</th>}
              {packing && <th className="py-2 text-center font-medium">Packed</th>}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-[#eeeeee]">
                <td className="py-2 pr-2">{item.productName}</td>
                <td className="py-2 pr-2 text-[#555555]">{item.variant ?? "-"}</td>
                {!packing && (
                  <td className="py-2 pr-2 text-right">{formatPrice(item.unitPrice)}</td>
                )}
                <td className="py-2 pr-2 text-right">{item.quantity}</td>
                {!packing && (
                  <td className="py-2 text-right">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </td>
                )}
                {packing && (
                  <td className="py-2 text-center">
                    <span className="inline-block h-4 w-4 border border-[#111111]" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {!packing && (
          <div className="ml-auto mt-4 w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[#555555]">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#555555]">Delivery</span>
              <span>{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between border-t border-[#dddddd] pt-1 text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        )}

        {order.note && (
          <p className="mt-5 text-sm">
            <span className="font-semibold">Customer note: </span>
            {order.note}
          </p>
        )}

        <p className="mt-8 border-t border-[#dddddd] pt-4 text-center text-xs text-[#555555]">
                    Thank you for shopping with {b.brand}.
          {b.phone.trim() ? ` Questions? Call ${b.phone}.` : ""}
        </p>
      </div>
    </div>
  );
}