import Link from "next/link";
import T from "@/components/i18n/T";

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
        <div>
          <h3 className="mb-2 text-lg font-bold text-pink-600">WomensHub</h3>
          <p className="text-gray-500">
            <T>Your beauty, delivered.</T>
          </p>
        </div>

        <div>
          <h4 className="mb-2 font-semibold">
            <T>Shop</T>
          </h4>
          <ul className="space-y-1 text-gray-500">
            <li>
              <Link href="/products">
                <T>All Products</T>
              </Link>
            </li>
            <li>
              <Link href="/category/skincare">
                <T>Skincare</T>
              </Link>
            </li>
            <li>
              <Link href="/category/makeup">
                <T>Makeup</T>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-2 font-semibold">
            <T>Help</T>
          </h4>
          <ul className="space-y-1 text-gray-500">
            <li>
              <Link href="/account">
                <T>My Account</T>
              </Link>
            </li>
            <li>
              <Link href="/wishlist">
                <T>Wishlist</T>
              </Link>
            </li>
            <li>
              <Link href="/cart">
                <T>Cart</T>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <p className="border-t py-3 text-center text-xs text-gray-400">
        © 2026 WomensHub. <T>All rights reserved.</T>
      </p>
    </footer>
  );
}