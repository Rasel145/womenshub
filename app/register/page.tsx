"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import PasswordInput from "@/components/ui/PasswordInput";
import { registerAction } from "@/app/actions/auth";

interface FormState {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirm: string;
}

type Errors = Partial<Record<keyof FormState | "terms", string>>;

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function validate() {
    const next: Errors = {};

    if (form.name.trim().length < 3) next.name = "Enter your full name";
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim()))
      next.phone = "Enter a valid mobile number (e.g. 01712345678)";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "Enter a valid email address";
    if (form.password.length < 8)
      next.password = "Password must be at least 8 characters";
    if (form.confirm !== form.password) next.confirm = "Passwords do not match";
    if (!agreed) next.terms = "You must accept the terms to continue";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !validate()) return;

    setLoading(true);
    setServerError(null);

    // On success the server redirects to /account, so we only handle errors here
    const result = await registerAction({
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      password: form.password,
    });
    if (result && !result.ok) {
      setServerError(result.error);
      setLoading(false);
    }
  }

  const inputClass = (field: keyof FormState) =>
    clsx(
      "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500",
      errors[field] && "border-red-500"
    );

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <div className="rounded-xl border bg-white p-6">
        <h1 className="mb-1 text-2xl font-bold">Create Account</h1>
        <p className="mb-6 text-sm text-gray-500">
          Sign up to track orders and save your wishlist.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Nusrat Jahan"
              autoComplete="name"
              className={inputClass("name")}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Mobile number</label>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="01712345678"
              inputMode="numeric"
              maxLength={11}
              autoComplete="tel"
              className={inputClass("phone")}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Email <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass("email")}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <PasswordInput
              value={form.password}
              onChange={(v) => update("password", v)}
              hasError={!!errors.password}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirm password</label>
            <PasswordInput
              value={form.confirm}
              onChange={(v) => update("confirm", v)}
              hasError={!!errors.confirm}
              autoComplete="new-password"
              placeholder="Re-enter your password"
            />
            {errors.confirm && (
              <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>
            )}
          </div>

          <div>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  setErrors((p) => ({ ...p, terms: undefined }));
                }}
                className="mt-0.5 accent-pink-600"
              />
              I agree to the Terms &amp; Conditions and Privacy Policy
            </label>
            {errors.terms && <p className="mt-1 text-xs text-red-600">{errors.terms}</p>}
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-pink-600 py-3 font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-pink-600">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}