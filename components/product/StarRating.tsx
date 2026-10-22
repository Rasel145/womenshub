import { Star } from "lucide-react";
import clsx from "clsx";

// Shows 1 to 5 stars. The value is rounded to the nearest whole star.
export default function StarRating({
  value,
  size = 16,
}: {
  value: number;
  size?: number;
}) {
  const filled = Math.round(value);

  return (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={clsx(
            n <= filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          )}
        />
      ))}
    </span>
  );
}