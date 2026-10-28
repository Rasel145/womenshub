import { Suspense } from "react";
import Link from "next/link";
import T from "@/components/i18n/T";
import { getCategories } from "@/lib/categories";
import { business as b } from "@/lib/business";

async function FooterCategories() {
  const categories = await getCategories();

  return (
    <ul className="space-y-1 text-gray-500">
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

export default function Footer() {
  return (
    <footer className="mt-12 border-t bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
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
              <Link href="/search">
                <T>Search</T>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-2 font-semibold">
            <T>Categories</T>
          </h4>
          <Suspense fallback={null}>
            <FooterCategories />
          </Suspense>
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
            <li>
              <Link href="/terms">
                <T>Terms & Conditions</T>
              </Link>
            </li>
            <li>
              <Link href="/privacy">
                <T>Privacy Policy</T>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Business identity: the digital commerce guidelines ask for this to be shown */}
      <div className="border-t px-4 py-3 text-center text-xs text-gray-400">
        <p>
          © 2026 {b.brand}. <T>All rights reserved.</T>
        </p>
        <p className="mt-1">
          {b.legalName} · <T>Trade License</T>: {b.tradeLicense} · <T>TIN</T>: {b.tin}
          {b.bin ? (
            <>
              {" "}
              · <T>BIN</T>: {b.bin}
            </>
          ) : null}
          {b.ubid ? (
            <>
              {" "}
              · <T>UBID</T>: {b.ubid}
            </>
          ) : null}
        </p>
      </div>
    </footer>
  );
}