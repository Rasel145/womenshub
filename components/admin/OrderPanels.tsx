"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markOrderSeen,
  updateOrderDetails,
  saveShippingInfo,
  addOrderEvent,
  saveAdminNote,
} from "@/app/actions/admin-orders";

type Result = { ok: true } | { ok: false; error: string };

const COURIERS = ["Steadfast", "Pathao", "RedX", "Own rider", "Other"];

const inputClass =
  "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500";
const primaryButton =
  "rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50";

// Runs an admin action, shows the error or "Saved", and refreshes the page data
function useSubmit() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function run(action: () => Promise<Result>, onDone?: () => void) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error);
      setSaved(true);
      onDone?.();
      router.refresh();
    });
  }

  return { pending, error, saved, run };
}

function Feedback({ error, saved }: { error: string | null; saved: boolean }) {
  if (error)
    return <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>;
  if (saved) return <p className="mt-2 text-xs text-green-600">Saved.</p>;
  return null;
}

// Opening an order removes it from the "new orders" count
export function MarkOrderSeen({ orderId }: { orderId: string }) {
  useEffect(() => {
    markOrderSeen(orderId).catch(() => {});
  }, [orderId]);

  return null;
}

// ---------------------------------------------------------------------------

export function OrderEditPanel({
  orderId,
  editable,
  initial,
  accountLabel,
  areaLabel,
}: {
  orderId: string;
  editable: boolean;
  initial: { name: string; phone: string; address: string; city: string; note: string };
  accountLabel: string;
  areaLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);
  const { pending, error, saved, run } = useSubmit();

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (!editing) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Customer</h2>
          {editable && (
            <button
              type="button"
              onClick={() => {
                setForm(initial);
                setEditing(true);
              }}
              className="text-xs font-medium text-pink-600 hover:underline"
            >
              Edit
            </button>
          )}
        </div>
        <p>{initial.name}</p>
        <p className="text-gray-500">{initial.phone}</p>
        <p className="mt-1 text-xs text-gray-400">{accountLabel}</p>

        <h2 className="mb-2 mt-5 font-semibold">Delivery address</h2>
        <p className="whitespace-pre-line text-gray-600">{initial.address}</p>
        <p className="text-gray-600">{initial.city}</p>
        <p className="mt-1 text-xs text-gray-400">{areaLabel}</p>

        {initial.note && (
          <>
            <h2 className="mb-2 mt-5 font-semibold">Customer note</h2>
            <p className="text-gray-600">{initial.note}</p>
          </>
        )}
        {!editable && (
          <p className="mt-4 text-xs text-gray-400">
            Details cannot be changed after the order is shipped.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => updateOrderDetails(orderId, form),
          () => setEditing(false)
        );
      }}
      className="space-y-3"
    >
      <h2 className="font-semibold">Edit customer details</h2>
      <input
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        className={inputClass}
        placeholder="Full name"
      />
      <input
        value={form.phone}
        onChange={(e) => set("phone", e.target.value)}
        className={inputClass}
        placeholder="01712345678"
        inputMode="numeric"
        maxLength={11}
      />
      <textarea
        value={form.address}
        onChange={(e) => set("address", e.target.value)}
        className={inputClass}
        rows={3}
        placeholder="Full address"
      />
      <input
        value={form.city}
        onChange={(e) => set("city", e.target.value)}
        className={inputClass}
        placeholder="City / District"
      />
      <input
        value={form.note}
        onChange={(e) => set("note", e.target.value)}
        className={inputClass}
        placeholder="Customer note (optional)"
        maxLength={300}
      />

      <Feedback error={error} saved={saved} />

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function ShippingPanel({
  orderId,
  initial,
}: {
  orderId: string;
  initial: { courier: string; trackingCode: string; consignmentId: string };
}) {
  const [form, setForm] = useState(initial);
  const { pending, error, saved, run } = useSubmit();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveShippingInfo(orderId, form));
      }}
      className="space-y-3"
    >
      <h2 className="font-semibold">Courier</h2>

      <select
        value={form.courier}
        onChange={(e) => setForm((p) => ({ ...p, courier: e.target.value }))}
        className={inputClass}
      >
        <option value="">Not sent yet</option>
        {COURIERS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        value={form.trackingCode}
        onChange={(e) => setForm((p) => ({ ...p, trackingCode: e.target.value }))}
        className={inputClass}
        placeholder="Tracking code"
        maxLength={60}
      />
      <input
        value={form.consignmentId}
        onChange={(e) => setForm((p) => ({ ...p, consignmentId: e.target.value }))}
        className={inputClass}
        placeholder="Consignment ID"
        maxLength={40}
      />

      <Feedback error={error} saved={saved} />

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Saving..." : "Save courier info"}
      </button>
      <p className="text-xs text-gray-400">
        When the courier or tracking code changes, the customer sees it in the timeline.
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function AddEventForm({ orderId }: { orderId: string }) {
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState("");
  const [visible, setVisible] = useState(true);
  const { pending, error, saved, run } = useSubmit();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () => addOrderEvent(orderId, { message, location, visibleToCustomer: visible }),
          () => {
            setMessage("");
            setLocation("");
          }
        );
      }}
      className="mt-5 space-y-3 border-t pt-4"
    >
      <h3 className="text-sm font-medium">Add an update</h3>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={inputClass}
        placeholder="e.g. Parcel reached the Dhaka hub"
        maxLength={200}
      />
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className={inputClass}
        placeholder="Location (optional)"
        maxLength={80}
      />
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
          className="accent-pink-600"
        />
        Show this update to the customer
      </label>

      <Feedback error={error} saved={saved} />

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Adding..." : "Add update"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function AdminNotePanel({
  orderId,
  initial,
}: {
  orderId: string;
  initial: string;
}) {
  const [note, setNote] = useState(initial);
  const { pending, error, saved, run } = useSubmit();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveAdminNote(orderId, note));
      }}
      className="space-y-3"
    >
      <h2 className="font-semibold">Internal note</h2>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className={inputClass}
        rows={3}
        maxLength={500}
        placeholder="e.g. Called, customer will receive tomorrow"
      />
      <Feedback error={error} saved={saved} />
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Saving..." : "Save note"}
      </button>
      <p className="text-xs text-gray-400">Only the team sees this. Customers never do.</p>
    </form>
  );
}