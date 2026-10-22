"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCategory, updateCategory } from "@/app/actions/admin-categories";
import { slugify } from "@/lib/slug";

interface Props {
  mode: "create" | "edit";
  categoryId?: string;
  initial?: { name: string; slug: string; position: number };
}

const inputClass =
  "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500";

export default function CategoryForm({ mode, categoryId, initial }: Props) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [position, setPosition] = useState(initial ? String(initial.position) : "0");
  // In create mode the slug follows the name until the admin edits the slug by hand
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);

    const input = { name, slug, position: Number(position) };
    const result =
      mode === "create"
        ? await createCategory(input)
        : await updateCategory(categoryId!, input);

    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <section className="space-y-4 rounded-xl border bg-white p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Category name</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={inputClass}
            placeholder="Bath & Body"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">URL slug</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={inputClass}
            placeholder="bath-body"
          />
          <p className="mt-1 text-xs text-gray-500">
            The category page will be /category/{slug || "your-slug"}. Changing it later
            breaks old links to this category.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Display order</label>
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            inputMode="numeric"
            className={inputClass}
            placeholder="1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Smaller numbers come first in the menu. Categories with the same number are
            shown in A to Z order.
          </p>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-pink-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
        >
          {saving
            ? "Saving..."
            : mode === "create"
              ? "Create category"
              : "Save changes"}
        </button>
        <Link
          href="/admin/categories"
          className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}