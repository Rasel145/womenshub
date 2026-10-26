"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { expireStaleOrders } from "@/app/actions/admin-expire";

export default function ExpireOrdersButton({
  count,
  hours,
}: {
  count: number;
  hours: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    const orders = count === 1 ? "order" : "orders";
    if (
      !window.confirm(
        `Cancel ${count} pending ${orders} older than ${hours} hours? The stock will be returned. This cannot be undone.`
      )
    )
      return;

    setMessage(null);
    startTransition(async () => {
      const result = await expireStaleOrders();
      if (!result.ok) return setMessage(result.error);

      setMessage(
        `${result.cancelled} ${result.cancelled === 1 ? "order" : "orders"} cancelled.`
      );
      router.refresh();
    });
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending
          ? "Cancelling..."
          : `Cancel ${count} ${count === 1 ? "order" : "orders"} older than ${hours} hours`}
      </button>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </div>
  );
}