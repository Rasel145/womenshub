"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import PasswordInput from "@/components/ui/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: typeof errors = {};
    const id = identifier.trim();
    const isPhone = /^01[3-9]\d{8}$/.test(id);
    const isEmail = /^\S+@\S+\.\S+$/.test(id);

    if (!isPhone && !isEmail) next.identifier = "Enter a valid mobile number or email";
    if (password.length < 6) next.password = "Password must be at least 6 characters";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // Backend login API call will go here. Fake delay for now.
    await new Promise((r) => setTimeout(r, 800));
    router.push("/account");
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <div className="rounded-xl border bg-white p-6">
        <h1 className="mb-1 text-2xl font-bold">Login</h1>
        <p className="mb-6 text-sm text-gray-500">
          Welcome back to WomensHub. Sign in to your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Mobile number or Email
            </label>
            <input
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setErrors((p) => ({ ...p, identifier: undefined }));
              }}
              placeholder="01712345678 or you@example.com"
              autoComplete="username"
              className={clsx(
                "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500",
                errors.identifier && "border-red-500"
              )}
            />
            {errors.identifier && (
              <p className="mt-1 text-xs text-red-600">{errors.identifier}</p>
            )}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium">Password</label>
              <Link href="/forgot-password" className="text-xs text-pink-600">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              value={password}
              onChange={(v) => {
                setPassword(v);
                setErrors((p) => ({ ...p, password: undefined }));
              }}
              hasError={!!errors.password}
              autoComplete="current-password"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-pink-600 py-3 font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-pink-600">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}