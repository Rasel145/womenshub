"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockPhone, unblockPhone } from "@/app/actions/admin-blocklist";

// "Block this number" button on the order page
export function BlockPhoneButton({ phone }: { phone: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const reason = window.prompt(
      "Block this mobile number from placing orders? Write a short reason (optional):",
      ""
    );
    if (reason === null) return;

    setError(null);
    startTransition(async () => {
      const result = await blockPhone(phone, reason);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Blocking..." : "Block this number"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Add a number by hand on the "Blocked numbers" page
export function AddBlockForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await blockPhone(phone, reason);
          if (!result.ok) return setError(result.error);
          setPhone("");
          setReason("");
          router.refresh();
        });
      }}
      className="mb-6 rounded-xl border bg-white p-4"
    >
      <h2 className="mb-3 font-semibold">Block a number</h2>
      <div className="flex flex-wrap gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01712345678"
          inputMode="numeric"
          maxLength={11}
          className="w-44 rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          maxLength={200}
          className="min-w-[200px] flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
        >
          {pending ? "Blocking..." : "Block"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}

export function UnblockButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm("Allow this number to place orders again?")) return;

    setError(null);
    startTransition(async () => {
      const result = await unblockPhone(id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <span>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Removing..." : "Unblock"}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  );
}