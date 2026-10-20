"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  requestPasswordReset,
  confirmPasswordReset,
} from "@/app/actions/password-reset";

type Step = "request" | "reset" | "done";

const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Counts down the "resend" timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function identifierLooksValid() {
    const id = identifier.trim();
    return /^01[3-9]\d{8}$/.test(id) || /^\S+@\S+\.\S+$/.test(id);
  }

  async function sendCode() {
    if (!identifierLooksValid()) {
      setError("Enter a valid mobile number or email.");
      return false;
    }

    setLoading(true);
    setError(null);
    const result = await requestPasswordReset(identifier);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return false;
    }

    setCooldown(RESEND_SECONDS);
    return true;
  }

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (await sendCode()) setStep("reset");
  }

  async function handleResend() {
    if (loading || cooldown > 0) return;
    await sendCode();
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!/^\d{6}$/.test(code.trim())) return setError("Enter the 6-digit code.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    setError(null);
    const result = await confirmPasswordReset({ identifier, code, password });
    setLoading(false);

    if (!result.ok) return setError(result.error);
    setStep("done");
  }

  const inputClass =
    "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500";

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <div className="rounded-xl border bg-white p-6">
        {step === "request" && (
          <>
            <h1 className="mb-1 text-2xl font-bold">Forgot password</h1>
            <p className="mb-6 text-sm text-gray-500">
              Enter your mobile number or email. We will send you a 6-digit code.
            </p>

            <form onSubmit={handleRequest} className="space-y-4" noValidate>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Mobile number or Email
                </label>
                <input
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError(null);
                  }}
                  placeholder="01712345678 or you@example.com"
                  autoComplete="username"
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-pink-600 py-3 font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
              >
                {loading ? "Sending..." : "Send code"}
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <h1 className="mb-1 text-2xl font-bold">Enter your code</h1>
            <p className="mb-6 text-sm text-gray-500">
              If an account exists for <span className="font-medium">{identifier}</span>, we
              sent a 6-digit code. It expires in 10 minutes.
            </p>

            {process.env.NODE_ENV !== "production" && (
              <p className="mb-4 rounded-lg bg-gray-100 p-3 text-xs text-gray-600">
                Development mode: the code is printed in the terminal where
                &quot;npm run dev&quot; is running.
              </p>
            )}

            <form onSubmit={handleReset} className="space-y-4" noValidate>
              <div>
                <label className="mb-1 block text-sm font-medium">6-digit code</label>
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError(null);
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className={clsx(inputClass, "tracking-widest")}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">New password</label>
                <PasswordInput
                  value={password}
                  onChange={(v) => {
                    setPassword(v);
                    setError(null);
                  }}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Confirm new password
                </label>
                <PasswordInput
                  value={confirm}
                  onChange={(v) => {
                    setConfirm(v);
                    setError(null);
                  }}
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-pink-600 py-3 font-medium text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
              >
                {loading ? "Saving..." : "Change password"}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                className="text-pink-600 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setCode("");
                  setError(null);
                }}
                className="text-gray-500 hover:text-pink-600"
              >
                Use a different number
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold">Password changed</h1>
            <p className="mb-6 text-sm text-gray-500">
              Your password has been updated. You have been logged out of all devices,
              so please log in with your new password.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-pink-600 px-6 py-3 font-medium text-white hover:bg-pink-700"
            >
              Go to login
            </Link>
          </div>
        )}

        {step !== "done" && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Remembered it?{" "}
            <Link href="/login" className="font-medium text-pink-600">
              Back to login
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}