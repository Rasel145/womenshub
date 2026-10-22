"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategory } from "@/app/actions/admin-categories";

export default function DeleteCategoryButton({
  id,
  name,
  productCount,
}: {
  id: string;
  name: string;
  productCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // A category with products cannot be deleted
  if (productCount > 0) {
    return (
      <span
        className="cursor-not-allowed text-gray-300"
        title="Move its products to another category first"
      >
        Delete
      </span>
    );
  }

  function handleClick() {
    if (!window.confirm(`Delete the category "${name}"? This cannot be undone.`)) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
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
        {pending ? "Deleting..." : "Delete"}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  );
}