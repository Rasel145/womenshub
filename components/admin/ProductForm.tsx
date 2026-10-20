"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProduct, updateProduct } from "@/app/actions/admin-products";
import { slugify } from "@/lib/slug";

interface Initial {
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  description: string;
  variants: string[];
  images: string[];
  isActive: boolean;
}

interface Props {
  mode: "create" | "edit";
  productId?: string;
  categories: { id: string; name: string }[];
  brandNames: string[];
  initial?: Initial;
}

const MAX_IMAGES = 4;
const MAX_BYTES = 3 * 1024 * 1024;

const inputClass =
  "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500";

export default function ProductForm({
  mode,
  productId,
  categories,
  brandNames,
  initial,
}: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    brand: initial?.brand ?? "",
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    price: initial ? String(initial.price) : "",
    oldPrice: initial?.oldPrice ? String(initial.oldPrice) : "",
    stock: initial ? String(initial.stock) : "0",
    description: initial?.description ?? "",
    variants: initial?.variants.join(", ") ?? "",
    isActive: initial?.isActive ?? true,
  });
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // In create mode the slug follows the name until the admin edits the slug by hand
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  }

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;

    setUploadError(null);
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setUploadError(`You can add up to ${MAX_IMAGES} images.`);
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of files.slice(0, room)) {
      if (file.size > MAX_BYTES) {
        setUploadError(`${file.name} is larger than 3 MB.`);
        continue;
      }

      const body = new FormData();
      body.append("file", file);

      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) {
          setUploadError(data.error ?? "Upload failed.");
          continue;
        }
        uploaded.push(data.url);
      } catch {
        setUploadError("Upload failed. Check your connection and try again.");
      }
    }

    setImages((prev) => [...prev, ...uploaded].slice(0, MAX_IMAGES));
    setUploading(false);
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  function makeMain(url: string) {
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || uploading) return;

    setSaving(true);
    setError(null);

    const input = {
      name: form.name,
      slug: form.slug,
      brand: form.brand,
      categoryId: form.categoryId,
      price: Number(form.price),
      oldPrice: form.oldPrice.trim() === "" ? null : Number(form.oldPrice),
      stock: Number(form.stock),
      description: form.description,
      variants: form.variants
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      images,
      isActive: form.isActive,
    };

    const result =
      mode === "create"
        ? await createProduct(input)
        : await updateProduct(productId!, input);

    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <section className="space-y-4 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Basic information</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Product name</label>
          <input
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={inputClass}
            placeholder="Gentle Skin Cleanser 250ml"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">URL slug</label>
          <input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
            className={inputClass}
            placeholder="gentle-skin-cleanser-250ml"
          />
          <p className="mt-1 text-xs text-gray-500">
            The product page will be /products/{form.slug || "your-slug"}. Changing it
            later breaks old links to this product.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Brand</label>
            <input
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              list="brand-options"
              className={inputClass}
              placeholder="Cetaphil"
            />
            <datalist id="brand-options">
              {brandNames.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-gray-500">
              Pick an existing brand or type a new one.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={inputClass}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            className={inputClass}
            placeholder="What is this product and who is it for?"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-white p-5">
        <div>
          <h2 className="font-semibold">Images</h2>
          <p className="text-xs text-gray-500">
            Up to {MAX_IMAGES} images (JPG, PNG or WebP, max 3 MB each). The first image
            is the main one shown in the store.
          </p>
        </div>

        {images.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {images.map((url, index) => (
              <li key={url} className="w-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Product image ${index + 1}`}
                  className="h-28 w-28 rounded-lg border object-cover"
                />
                <div className="mt-1 flex items-center justify-between text-xs">
                  {index === 0 ? (
                    <span className="font-medium text-pink-600">Main</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeMain(url)}
                      className="text-gray-600 hover:text-pink-600"
                    >
                      Make main
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {images.length < MAX_IMAGES && (
          <label className="inline-block cursor-pointer rounded-lg border border-dashed px-4 py-3 text-sm text-gray-600 hover:border-pink-400 hover:text-pink-600">
            {uploading ? "Uploading..." : "Choose images"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={uploading}
              className="hidden"
              onChange={(e) => {
                // Copy the files first, because clearing the input also clears the list
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                handleFiles(files);
              }}
            />
          </label>
        )}

        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      </section>

      <section className="space-y-4 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Price and stock</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Price (৳)</label>
            <input
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              inputMode="numeric"
              className={inputClass}
              placeholder="1250"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Old price (৳) <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={form.oldPrice}
              onChange={(e) => set("oldPrice", e.target.value)}
              inputMode="numeric"
              className={inputClass}
              placeholder="1450"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Stock</label>
            <input
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
              inputMode="numeric"
              className={inputClass}
              placeholder="50"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Old price is shown crossed out and creates the discount badge. It must be
          higher than the price.
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Options <span className="text-gray-400">(optional)</span>
          </label>
          <input
            value={form.variants}
            onChange={(e) => set("variants", e.target.value)}
            className={inputClass}
            placeholder="125ml, 250ml, 500ml"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate with commas. Use this for sizes or shades. Leave empty if there is
            only one version.
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="mt-0.5 accent-pink-600"
          />
          <span>
            <span className="block font-medium">Visible in store</span>
            <span className="text-xs text-gray-500">
              Untick to hide this product from customers. Old orders are not affected.
            </span>
          </span>
        </label>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-lg bg-pink-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
        >
          {saving
            ? "Saving..."
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </button>
        <Link
          href="/admin/products"
          className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}