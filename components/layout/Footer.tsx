import { Suspense } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import T from "@/components/i18n/T";
import { getCategories } from "@/lib/categories";
import { business as b } from "@/lib/business";
import { registrationParts } from "@/lib/legal/contact";

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
  const phone = b.phone.trim();
  const email = b.email.trim();
  const address = b.address.trim();
  const registration = registrationParts();

  return (
    <footer className="mt-12 border-t bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="mb-2 text-lg font-bold text-pink-600">WomensHub</h3>
          <p className="text-gray-500">
            <T>Your beauty, delivered.</T>
          </p>

          {(phone || email || address) && (
            <ul className="mt-4 space-y-2 text-gray-600">
              {phone && (
                <li className="flex items-center gap-2">
                  <Phone size={15} className="shrink-0 text-pink-600" />
                  <a href={`tel:${phone}`} className="hover:text-pink-600">
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2">
                  <Mail size={15} className="shrink-0 text-pink-600" />
                  <a href={`mailto:${email}`} className="break-all hover:text-pink-600">
                    {email}
                  </a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-pink-600" />
                  <span>{address}</span>
                </li>
              )}
            </ul>
          )}
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

      <div className="border-t px-4 py-3 text-center text-xs text-gray-400">
        <p>
          © 2026 {b.brand}. <T>All rights reserved.</T>
        </p>

        {/* Shown only if you fill in your registration numbers in lib/business.ts */}
        {registration.length > 0 && (
          <p className="mt-1">
            {registration.map((p, i) => (
              <span key={p.label}>
                {i > 0 && " · "}
                <T>{p.label}</T>: {p.value}
              </span>
            ))}
          </p>
        )}
      </div>
    </footer>
  );
}