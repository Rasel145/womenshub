import Link from "next/link";
import { getCategories } from "@/lib/categories";
import T from "@/components/i18n/T";

export default async function CategoryLinks() {
  const categories = await getCategories();

  return (
    <ul className="mx-auto flex max-w-6xl gap-5 overflow-x-auto whitespace-nowrap px-4 py-2 text-sm">
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={`/category/${c.slug}`}>
            <T>{c.name}</T>
          </Link>
        </li>
      ))}
    </ul>
  );
}