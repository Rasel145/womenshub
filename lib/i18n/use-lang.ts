import { useSyncExternalStore } from "react";
import { bn } from "@/lib/i18n/bn";

function subscribe(callback: () => void) {
  window.addEventListener("langchange", callback);
  return () => window.removeEventListener("langchange", callback);
}

function getSnapshot(): "en" | "bn" {
  return document.documentElement.dataset.lang === "bn" ? "bn" : "en";
}

export function useLang() {
  return useSyncExternalStore(subscribe, getSnapshot, () => "en" as const);
}

// For text inside attributes (placeholder, aria-label), where <T> cannot be used.
// Usage: const t = useT();  <input placeholder={t("Search products, brands...")} />
export function useT() {
  const lang = useLang();
  return (text: string) => (lang === "bn" ? (bn[text] ?? text) : text);
}