import Link from "next/link";
import T from "@/components/i18n/T";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
      <p className="text-6xl font-bold text-pink-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">
        <T>Page not found</T>
      </h1>
      <p className="mt-2 text-gray-500">
        <T>The page you are looking for does not exist or has moved.</T>
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-pink-600 px-6 py-3 text-sm font-medium text-white hover:bg-pink-700"
        >
          <T>Back to Home</T>
        </Link>
        <Link
          href="/products"
          className="rounded-lg border px-6 py-3 text-sm font-medium hover:bg-gray-50"
        >
          <T>Browse Products</T>
        </Link>
      </div>
    </main>
  );
}