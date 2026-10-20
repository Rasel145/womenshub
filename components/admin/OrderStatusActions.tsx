"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { updateOrderStatus } from "@/app/actions/admin-orders";
import { NEXT_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";

export default function OrderStatusActions({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const options = NEXT_STATUSES[current];

  function change(next: OrderStatus) {
    if (
      next === "CANCELLED" &&
      !window.confirm("Cancel this order? The stock will be returned. This cannot be undone.")
    )
      return;

    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (!result.ok) setError(result.error);
    });
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        This order is {STATUS_LABEL[current].toLowerCase()}. No further changes are possible.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((next) => (
          <button
            key={next}
            onClick={() => change(next)}
            disabled={pending}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
              next === "CANCELLED"
                ? "border border-red-300 text-red-600 hover:bg-red-50"
                : "bg-pink-600 text-white hover:bg-pink-700"
            )}
          >
            {next === "CANCELLED" ? "Cancel order" : `Mark as ${STATUS_LABEL[next]}`}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}