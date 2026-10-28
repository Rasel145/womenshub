"use client";

import clsx from "clsx";
import { useLang } from "@/lib/i18n/use-lang";

function setLanguage(next: "en" | "bn") {
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

export default function LegalLanguageSwitch() {
  const lang = useLang();

  const base = "rounded-md px-4 py-1.5 font-medium transition";

  return (
    <div className="mb-6 inline-flex rounded-lg border p-1 text-sm">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={lang === "en"}
        className={clsx(base, lang === "en" ? "bg-pink-600 text-white" : "text-gray-600")}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage("bn")}
        aria-pressed={lang === "bn"}
        className={clsx(base, lang === "bn" ? "bg-pink-600 text-white" : "text-gray-600")}
      >
        বাংলা
      </button>
    </div>
  );
}