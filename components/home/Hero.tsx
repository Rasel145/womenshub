import Link from "next/link";
import T from "@/components/i18n/T";

export default function Hero() {
  return (
    <section className="lang-stable bg-linear-to-r from-pink-600 to-pink-400">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-12 text-white sm:py-16 md:py-20">
        <h1 className="max-w-2xl text-3xl font-bold leading-snug sm:text-4xl md:text-[2.5rem]">
          <T>Beauty you will love, delivered to your door</T>
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-[#fdf2f8] sm:text-lg">
          <T>Skincare, makeup, haircare and more. Pay cash when it arrives.</T>
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/products"
            className="rounded-lg bg-[#ffffff] px-6 py-3 font-medium text-pink-600 transition hover:bg-[#fdf2f8]"
          >
            <T>Shop Now</T>
          </Link>
          <Link
            href="#categories"
            className="rounded-lg bg-[rgba(255,255,255,0.18)] px-6 py-3 font-medium text-white transition hover:bg-[rgba(255,255,255,0.3)]"
          >
            <T>Browse Categories</T>
          </Link>
        </div>
      </div>
    </section>
  );
}