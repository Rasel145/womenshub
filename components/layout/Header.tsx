import { Suspense } from "react";
import UserMenu from "./UserMenu";
import CartCount from "./CartCount"
import Link from "next/link";
import { Search, ShoppingBag, User, Heart } from "lucide-react";


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
        <form className="hidden flex-1 md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products, brands..."
              className="w-full rounded-full border bg-gray-50 py-2 pl-4 pr-10 text-sm outline-none focus:border-pink-500"
            />
            <Search
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </form>

        <nav className="ml-auto flex items-center gap-4">
          <Link href="/wishlist" aria-label="Wishlist">
            <Heart size={22} />
          </Link>
          <Link href="/account" aria-label="Account">
            <User size={22} />
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative">
            <ShoppingBag size={22} />
            <CartCount />
          </Link>
        </nav>
      </div>

      {/* Category links */}
      <div className="border-t">
        <ul className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 py-2 text-sm whitespace-nowrap">
          <li><Link href="/category/skincare">Skincare</Link></li>
          <li><Link href="/category/makeup">Makeup</Link></li>
          <li><Link href="/category/haircare">Haircare</Link></li>
          <li><Link href="/category/fragrance">Fragrance</Link></li>
          <li><Link href="/category/bath-body">Bath & Body</Link></li>
        </ul>
      </div>
    </header>
  );
}
<Link href="/login" aria-label="Login">
  <Suspense
  fallback={
    <Link href="/login" aria-label="Account">
      <User size={22} />
    </Link>
  }
>
  <UserMenu />
</Suspense>
</Link>