"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BellOff, X } from "lucide-react";
import { useAdminCounts } from "./AdminCounts";

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.onended = () => ctx.close();
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Browsers may block sound until the page has been clicked once
  }
}

export default function OrderAlerts() {
  const { unseen } = useAdminCounts();
  const pathname = usePathname();
  const previous = useRef(unseen);
  const [banner, setBanner] = useState(false);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    try {
      setSound(localStorage.getItem("adminSound") !== "off");
    } catch {}
  }, []);

  // A new order arrived: show the banner and make a sound
  useEffect(() => {
    if (unseen > previous.current) {
      setBanner(true);
      if (sound) beep();
      const timer = setTimeout(() => setBanner(false), 12000);
      previous.current = unseen;
      return () => clearTimeout(timer);
    }
    previous.current = unseen;
  }, [unseen, sound]);

  // Browser tab title: "(2) Admin | WomensHub"
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unseen > 0 ? `(${unseen}) ${base}` : base;
  }, [unseen, pathname]);

  function toggleSound() {
    const next = !sound;
    setSound(next);
    try {
      localStorage.setItem("adminSound", next ? "on" : "off");
    } catch {}
    if (next) beep();
  }

  return (
    <div className="print-hide fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {banner && (
        <div className="flex items-center gap-3 rounded-xl border border-pink-300 bg-pink-50 px-4 py-3 text-sm shadow-lg">
          <Bell size={18} className="text-pink-600" />
          <span className="font-medium">
            {unseen} new {unseen === 1 ? "order" : "orders"} waiting
          </span>
          <Link
            href="/admin/orders?status=PENDING"
            onClick={() => setBanner(false)}
            className="font-medium text-pink-600 underline"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => setBanner(false)}
            aria-label="Close"
            className="text-gray-500"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={toggleSound}
        className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-xs text-gray-600 shadow hover:bg-gray-50"
        title="Sound for new orders"
      >
        {sound ? <Bell size={14} /> : <BellOff size={14} />}
        Sound {sound ? "on" : "off"}
      </button>
    </div>
  );
}