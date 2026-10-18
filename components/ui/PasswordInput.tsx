"use client";

import { useState } from "react";
import clsx from "clsx";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  autoComplete?: string;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  hasError,
  autoComplete,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={clsx(
          "w-full rounded-lg border px-3 py-2 pr-10 text-sm outline-none focus:border-pink-500",
          hasError && "border-red-500"
        )}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}