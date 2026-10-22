import { Suspense } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User, Heart } from "lucide-react";
import UserMenu from "./UserMenu";
import CartCount from "./CartCount";
import CategoryLinks from "./CategoryLinks";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      {/* Top bar */}
      <div className="bg-pink-600 py-1.5 text-center text-xs text-white">
        Free delivery on orders over ৳2000
      </div>

      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-pink-600">
          WomensHub
        </Link>

        {/* Search (desktop) */}
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
              placeholder="Search products, brands..."
              className="w-full rounded-full border bg-gray-50 py-2 pl-4 pr-10 text-sm outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-600"
            >
              <Search size={18} />
            </button>
          </div>
        </form>

        <nav className="ml-auto flex items-center gap-4">
          {/* Search (mobile) */}
          <Link href="/search" aria-label="Search" className="md:hidden">
            <Search size={22} />
          </Link>

          <Link href="/wishlist" aria-label="Wishlist">
            <Heart size={22} />
          </Link>

          <Suspense
            fallback={
              <Link href="/login" aria-label="Account">
                <User size={22} />
              </Link>
            }
          >
            <UserMenu />
          </Suspense>

          <Link href="/cart" aria-label="Cart" className="relative">
            <ShoppingBag size={22} />
            <CartCount />
          </Link>
        </nav>
      </div>

      {/* Category links (from the database) */}
      <div className="border-t">
        <Suspense fallback={<div className="mx-auto h-9 max-w-6xl px-4" />}>
          <CategoryLinks />
        </Suspense>
      </div>
    </header>
  );
}