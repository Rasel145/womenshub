import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <SuccessContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <>
      <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
      <h1 className="mb-2 text-2xl font-bold">Order placed successfully!</h1>
      {id && (
        <p className="mb-1 text-gray-600">
          Your order number: <span className="font-semibold">#{id}</span>
        </p>
      )}
      <p className="mb-8 text-sm text-gray-500">
        We will contact you shortly to confirm your order.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          href="/products"
          className="rounded-lg bg-pink-600 px-6 py-3 font-medium text-white hover:bg-pink-700"
        >
          Continue Shopping
        </Link>
        <Link
          href="/account"
          className="rounded-lg border px-6 py-3 font-medium hover:bg-gray-50"
        >
          My Account
        </Link>
      </div>
    </>
  );
}