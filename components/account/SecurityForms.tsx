"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/ui/PasswordInput";
import { changePassword, signOutOtherDevices } from "@/app/actions/security";

export default function SecurityForms({
  minLength,
  sessions,
}: {
  minLength: number;
  sessions: number;
}) {
  const router = useRouter();

  // Change password
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwPending, startPw] = useTransition();
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState<string | null>(null);

  // Sign out other devices
  const [devPending, startDev] = useTransition();
  const [devMessage, setDevMessage] = useState<string | null>(null);
  const [devError, setDevError] = useState<string | null>(null);

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwDone(null);

    if (next.length < minLength)
      return setPwError(`The new password must be at least ${minLength} characters.`);
    if (next !== confirm) return setPwError("The new passwords do not match.");

    startPw(async () => {
      const result = await changePassword({ current, next });
      if (!result.ok) return setPwError(result.error);

      setCurrent("");
      setNext("");
      setConfirm("");
      setPwDone(
        `Password changed. ${result.signedOut} other ${
          result.signedOut === 1 ? "device was" : "devices were"
        } signed out.`
      );
      router.refresh();
    });
  }

  function signOutOthers() {
    if (!window.confirm("Sign out of every other device? This device stays signed in."))
      return;

    setDevError(null);
    setDevMessage(null);
    startDev(async () => {
      const result = await signOutOtherDevices();
      if (!result.ok) return setDevError(result.error);

      setDevMessage(
        `${result.signedOut} other ${result.signedOut === 1 ? "device was" : "devices were"} signed out.`
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submitPassword} className="space-y-4 rounded-xl border bg-white p-5" noValidate>
        <h2 className="font-semibold">Change password</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Current password</label>
          <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">New password</label>
          <PasswordInput
            value={next}
            onChange={setNext}
            autoComplete="new-password"
            placeholder={`At least ${minLength} characters`}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Confirm new password</label>
          <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </div>

        {pwError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{pwError}</p>}
        {pwDone && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{pwDone}</p>}

        <button
          type="submit"
          disabled={pwPending}
          className="rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
        >
          {pwPending ? "Saving..." : "Change password"}
        </button>
      </form>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Signed-in devices</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your account is signed in on {sessions} {sessions === 1 ? "device" : "devices"}{" "}
          (including this one). If you used a shared computer, or lost a phone, sign out the
          others.
        </p>

        {devError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{devError}</p>}
        {devMessage && (
          <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{devMessage}</p>
        )}

        <button
          type="button"
          onClick={signOutOthers}
          disabled={devPending || sessions <= 1}
          className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {devPending ? "Signing out..." : "Sign out all other devices"}
        </button>
      </section>
    </div>
  );
}