import { Suspense } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User, Heart } from "lucide-react";
import UserMenu from "./UserMenu";
import CartCount from "./CartCount";
import CategoryLinks from "./CategoryLinks";
import HeaderSearch from "./HeaderSearch";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import T from "@/components/i18n/T";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      {/* Top bar */}
      <div className="bg-pink-600 py-1.5 text-center text-xs text-white">
        <T>Free delivery on orders over ৳2000</T>
      </div>

      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4">
        <Link href="/" className="text-xl font-bold text-pink-600">
          WomensHub
        </Link>

        {/* Search (desktop) */}
        <HeaderSearch />

        <nav className="ml-auto flex items-center gap-3 sm:gap-4">
          {/* Search (mobile) */}
          <Link href="/search" aria-label="Search" className="md:hidden">
            <Search size={22} />
          </Link>

          <LanguageToggle />
          <ThemeToggle />

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