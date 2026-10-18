import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
        <div>
          <h3 className="mb-2 text-lg font-bold text-pink-600">WomensHub</h3>
          <p className="text-gray-500">Your beauty, delivered.</p>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">Shop</h4>
          <ul className="space-y-1 text-gray-500">
            <li><Link href="/products">All Products</Link></li>
            <li><Link href="/category/skincare">Skincare</Link></li>
            <li><Link href="/category/makeup">Makeup</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 font-semibold">Help</h4>
          <ul className="space-y-1 text-gray-500">
            <li><Link href="/account">My Account</Link></li>
            <li><Link href="/cart">Cart</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t py-3 text-center text-xs text-gray-400">
        © 2026 WomensHub. All rights reserved.
      </p>
    </footer>
  );
}