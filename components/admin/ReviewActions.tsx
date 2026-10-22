"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReviewVisible, deleteReview } from "@/app/actions/admin-reviews";

export default function ReviewActions({
  id,
  visible,
}: {
  id: string;
  visible: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await setReviewVisible(id, !visible);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteReview(id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <div>
      <span className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className="text-gray-600 hover:underline disabled:opacity-50"
        >
          {visible ? "Hide" : "Show"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </span>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}