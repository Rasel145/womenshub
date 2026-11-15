"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/ui/PasswordInput";
import { updateProfile, removeAvatar } from "@/app/actions/profile";
import { GENDERS, ageFromIsoDate } from "@/lib/profile";

interface Props {
  initial: {
    name: string;
    phone: string;
    email: string;
    gender: string;
    dateOfBirth: string;
    avatarUrl: string | null;
  };
}

const MAX_BYTES = 2 * 1024 * 1024;

const NETWORK_ERROR =
  "Could not reach the server. Please refresh the page and try again. If it keeps failing, tell the store.";

const inputClass =
  "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-pink-500";

export default function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Photo
  const [avatar, setAvatar] = useState(initial.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [removing, startRemove] = useTransition();

  // Details
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [gender, setGender] = useState(initial.gender);
  const [dob, setDob] = useState(initial.dateOfBirth);
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const emailChanged = email.trim().toLowerCase() !== initial.email.toLowerCase();
  const age = dob ? ageFromIsoDate(dob) : null;

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setAvatarError(null);
    if (file.size > MAX_BYTES) return setAvatarError("The photo must be smaller than 2 MB.");

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/account/avatar", { method: "POST", body });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAvatarError(data.error ?? "Upload failed.");
      } else {
        setAvatar(data.url);
        router.refresh();
      }
    } catch {
      setAvatarError("Upload failed. Check your connection and try again.");
    }
    setUploading(false);
  }

  function handleRemove() {
    if (!window.confirm("Remove your profile photo?")) return;

    setAvatarError(null);
    startRemove(async () => {
      try {
        const result = await removeAvatar();
        if (!result.ok) return setAvatarError(result.error);
        setAvatar(null);
        router.refresh();
      } catch {
        setAvatarError(NETWORK_ERROR);
      }
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setError(null);
    setSaved(false);

    if (name.trim().length < 3) return setError("Enter your full name.");
    if (emailChanged && !currentPassword)
      return setError("Enter your current password to change your email.");

    setSaving(true);
    try {
      const result = await updateProfile({
        name,
        email,
        gender,
        dateOfBirth: dob,
        currentPassword,
      });

      if (!result.ok) {
        setError(result.error);
      } else {
        setCurrentPassword("");
        setSaved(true);
        router.refresh();
      }
    } catch {
      // The server refused or could not be reached. Without this the button would seem dead.
      setError(NETWORK_ERROR);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Photo */}
      <section className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Profile photo</h2>

        <div className="flex items-center gap-5">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt="Your profile photo"
              className="h-24 w-24 rounded-full border object-cover"
            />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-pink-50 text-3xl font-bold text-pink-600">
              {initial.name.trim()[0]?.toUpperCase() ?? "?"}
            </span>
          )}

          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                // Copy the file first, because clearing the input also clears the list
                const file = e.target.files?.[0];
                e.target.value = "";
                handleFile(file);
              }}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || removing}
                className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : avatar ? "Change photo" : "Upload photo"}
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={uploading || removing}
                  className="rounded-lg border px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {removing ? "Removing..." : "Remove"}
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500">JPG, PNG or WebP, up to 2 MB.</p>
          </div>
        </div>

        {avatarError && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{avatarError}</p>
        )}
      </section>

      {/* Details */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border bg-white p-5"
        noValidate
      >
        <h2 className="font-semibold">Your details</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoComplete="name"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Mobile number</label>
          <input
            value={initial.phone}
            disabled
            className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-500`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Your mobile number is your login, so it cannot be changed here. Please contact us if
            you need to change it.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Email <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={120}
            autoComplete="email"
            className={inputClass}
          />
        </div>

        {emailChanged && (
          <div>
            <label className="mb-1 block text-sm font-medium">Current password</label>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              placeholder="Needed to change your email"
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Gender <span className="text-gray-400">(optional)</span>
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={inputClass}
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
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              min="1920-01-01"
              // max={todayIso()}
              className={inputClass}
            />
            {age !== null && age >= 0 && (
              <p className="mt-1 text-xs text-gray-500">Age: {age}</p>
            )}
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {saved && (
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Your profile has been saved.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        <p className="text-xs text-gray-500">
          Gender, date of birth and photo are optional and are only shown to you.
        </p>
      </form>
    </div>
  );
}