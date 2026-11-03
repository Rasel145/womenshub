"use client";

import { useLang } from "@/lib/i18n/use-lang";

export default function LanguageToggle() {
  const lang = useLang();

  function toggle() {
    const next = lang === "bn" ? "en" : "bn";
    const root = document.documentElement;

    if (next === "bn") {
      root.dataset.lang = "bn";
      root.lang = "bn";
    } else {
      delete root.dataset.lang;
      root.lang = "en";
    }

    try {
      localStorage.setItem("lang", next);
    } catch {}
    window.dispatchEvent(new Event("langchange"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={lang === "bn" ? "Switch to English" : "বাংলায় দেখুন"}
      className="inline-block min-w-[4.5rem] whitespace-nowrap rounded-full border px-2.5 py-1 text-center text-xs font-medium leading-5 text-gray-700 hover:bg-gray-100"
    >
      {lang === "bn" ? "English" : "বাংলা"}
    </button>
  );
}