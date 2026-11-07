"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import PasswordInput from "@/components/ui/PasswordInput";
import { registerAction } from "@/app/actions/auth";
import { GENDERS, ageFromIsoDate, todayIso } from "@/lib/profile";

interface FormState {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirm: string;
  gender: string;
  dob: string;
}

type Errors = Partial<Record<keyof FormState | "terms" | "photo", string>>;

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function RegisterPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
    gender: "",
    dob: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Free the memory of the preview picture when it is replaced or the page closes
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function update(field: keyof FormState, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function choosePhoto(file: File | undefined) {
    if (!file) return;

    if (!PHOTO_TYPES.includes(file.type))
      return setErrors((p) => ({ ...p, photo: "Only JPG, PNG or WebP photos are allowed." }));
    if (file.size > MAX_PHOTO_BYTES)
      return setErrors((p) => ({ ...p, photo: "The photo must be smaller than 2 MB." }));

    setErrors((p) => ({ ...p, photo: undefined }));
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhoto(null);
    setPreview(null);
    setErrors((p) => ({ ...p, photo: undefined }));
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

    if (form.dob) {
      const age = ageFromIsoDate(form.dob);
      if (age === null || age < 10 || age > 100) next.dob = "Enter a valid date of birth";
    }

    if (!agreed) next.terms = "You must accept the terms to continue";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !validate()) return;

    setLoading(true);
    setServerError(null);

    // 1. Create the account (this also signs the customer in)
    try {
      const result = await registerAction({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        gender: form.gender || undefined,
        dateOfBirth: form.dob || undefined,
      });

      if (!result || !result.ok) {
        setServerError(result?.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
    } catch {
      setServerError("Could not reach the server. Please check your connection and try again.");
      setLoading(false);
      return;
    }

    // 2. Upload the optional photo. If it fails, the account is still fine and the
    //    customer is taken to the profile page to try again.
    let next = "/account";
    if (photo) {
      try {
        const body = new FormData();
        body.append("file", photo);
        const res = await fetch("/api/account/avatar", { method: "POST", body });
        if (!res.ok) next = "/account/profile";
      } catch {
        next = "/account/profile";
      }
    }

    router.push(next);
  }

  const inputClass = (field: keyof FormState) =>
    clsx(
      "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500",
      errors[field] && "border-red-500"
    );

  const age = form.dob ? ageFromIsoDate(form.dob) : null;

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
              maxLength={80}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Gender <span className="text-gray-400">(optional)</span>
              </label>
              <select
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
                className={inputClass("gender")}
              >
                <option value="">Not set</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Date of birth <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => update("dob", e.target.value)}
                min="1920-01-01"
                max={todayIso()}
                autoComplete="bday"
                className={inputClass("dob")}
              />
              {errors.dob ? (
                <p className="mt-1 text-xs text-red-600">{errors.dob}</p>
              ) : (
                age !== null &&
                age >= 0 && <p className="mt-1 text-xs text-gray-500">Age: {age}</p>
              )}
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Profile photo <span className="text-gray-400">(optional)</span>
            </label>

            <div className="flex items-center gap-4">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Your chosen photo"
                  className="h-16 w-16 rounded-full border object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-xl font-bold text-pink-600">
                  {form.name.trim()[0]?.toUpperCase() ?? "?"}
                </span>
              )}

              <div className="space-y-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    // Copy the file first, because clearing the input also clears the list
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    choosePhoto(file);
                  }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    {photo ? "Change photo" : "Choose photo"}
                  </button>
                  {photo && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">JPG, PNG or WebP, up to 2 MB.</p>
              </div>
            </div>
            {errors.photo && <p className="mt-1 text-xs text-red-600">{errors.photo}</p>}
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
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-pink-600 underline">
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-pink-600 underline">
                  Privacy Policy
                </Link>
              </span>
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