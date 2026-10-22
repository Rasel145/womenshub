"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import clsx from "clsx";
import { submitReview, deleteMyReview } from "@/app/actions/reviews";

interface Props {
  productId: string;
  initial?: { rating: number; title: string | null; comment: string; hidden: boolean };
}

const inputClass =
  "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500";

export default function ReviewForm({ productId, initial }: Props) {
  const router = useRouter();

  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (rating < 1) return setError("Choose a rating from 1 to 5 stars.");
    if (comment.trim().length < 10)
      return setError("Please write at least 10 characters.");

    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await submitReview({ productId, rating, title, comment });
    setSaving(false);

    if (!result.ok) return setError(result.error);

    setSaved(true);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;

    setSaving(true);
    setError(null);
    const result = await deleteMyReview(productId);
    setSaving(false);

    if (!result.ok) return setError(result.error);

    setRating(0);
    setTitle("");
    setComment("");
    router.refresh();
  }

  const shown = hover || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-5" noValidate>
      <h3 className="font-semibold">
        {initial ? "Your review" : "Write a review"}
      </h3>

      {initial?.hidden && (
        <p className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Your review is currently hidden by the store, so other customers cannot see it.
        </p>
      )}

      <div>
        <p className="mb-1 text-sm font-medium">Rating</p>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setRating(n);
                setError(null);
              }}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              aria-pressed={rating === n}
              className="p-0.5"
            >
              <Star
                size={28}
                className={clsx(
                  n <= shown ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Title <span className="text-gray-400">(optional)</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          className={inputClass}
          placeholder="Sum it up in a few words"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Your review</label>
        <textarea
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            setError(null);
          }}
          rows={4}
          maxLength={1000}
          className={inputClass}
          placeholder="What did you like or dislike? How did it work for you?"
        />
        <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/1000</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {saved && !error && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Thank you! Your review has been saved.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
        >
          {saving ? "Saving..." : initial ? "Update review" : "Submit review"}
        </button>

        {initial && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            Delete my review
          </button>
        )}
      </div>
    </form>
  );
}