"use client";

import { Search } from "lucide-react";
import { useT } from "@/lib/i18n/use-lang";

export default function HeaderSearch() {
  const t = useT();

  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="hidden flex-1 md:block"
    >
      <div className="relative">
        <input
          type="search"
          name="q"
          maxLength={50}
          placeholder={t("Search products, brands...")}
          className="w-full rounded-full border bg-gray-50 py-2 pl-4 pr-10 text-sm outline-none focus:border-pink-500"
        />
        <button
          type="submit"
          aria-label={t("Search")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-600"
        >
          <Search size={18} />
        </button>
      </div>
    </form>
  );
}