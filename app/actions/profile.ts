"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { checkLimits, resetLimit, tooManyMessage } from "@/lib/rate-limit";
import { deleteStoredImage } from "@/lib/storage";
import { GENDERS, ageFromIsoDate, parseIsoDate } from "@/lib/profile";

type Result = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export async function updateProfile(input: {
  name: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  currentPassword: string;
}): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in first." };

  const name = input.name?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const gender = input.gender ?? "";
  const dob = input.dateOfBirth?.trim() ?? "";

  // Everything is checked here on the server, never trust the browser
  if (name.length < 3 || name.length > 80)
    return { ok: false, error: "Enter your full name (3 to 80 characters)." };
  if (email && (email.length > 120 || !EMAIL_RE.test(email)))
    return { ok: false, error: "Enter a valid email address." };
  if (gender && !GENDERS.some((g) => g.value === gender))
    return { ok: false, error: "Choose a gender from the list." };

  let dateOfBirth: Date | null = null;
  if (dob) {
    dateOfBirth = parseIsoDate(dob);
    const age = ageFromIsoDate(dob);
    if (!dateOfBirth || age === null || age < 10 || age > 100)
      return { ok: false, error: "Enter a valid date of birth." };
  }

  const limited = await checkLimits([
    { key: `profile:user:${user.id}`, limit: 20, windowSeconds: 60 * 60 },
  ]);
  if (!limited.allowed)
    return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  try {
    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, passwordHash: true },
    });
    if (!current) return { ok: false, error: "Account not found." };

    // Changing the email needs the current password, because the email can be used to reset the password
    const emailChanged = (current.email ?? "") !== email;
    if (emailChanged) {
      const pwKey = `profile-email:user:${user.id}`;
      const pwLimit = await checkLimits([{ key: pwKey, limit: 5, windowSeconds: 15 * 60 }]);
      if (!pwLimit.allowed)
        return { ok: false, error: tooManyMessage(pwLimit.retryAfterSeconds) };

      if (!input.currentPassword)
        return { ok: false, error: "Enter your current password to change your email." };
      if (!(await verifyPassword(input.currentPassword, current.passwordHash)))
        return { ok: false, error: "Your current password is not correct." };

      await resetLimit(pwKey);
    }

    if (emailChanged && email) {
      const taken = await prisma.user.findFirst({
        where: { email, NOT: { id: user.id } },
        select: { id: true },
      });
      if (taken)
        return { ok: false, error: "This email is already used by another account." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email: email || null,
        gender: gender && gender !== "" ? gender : null,
        dateOfBirth,
      },
    });
  } catch (e) {
    // P2002 = the same email was taken at the same moment
    if ((e as { code?: string }).code === "P2002")
      return { ok: false, error: "This email is already used by another account." };
    console.error("updateProfile failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true };
}

export async function removeAvatar(): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in first." };

  const limited = await checkLimits([
    { key: `avatar-remove:user:${user.id}`, limit: 20, windowSeconds: 60 * 60 },
  ]);
  if (!limited.allowed)
    return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  try {
    // The file to delete is read from the database, never taken from the browser
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    });

    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: null } });
    await deleteStoredImage(row?.avatarUrl);
  } catch (e) {
    console.error("removeAvatar failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true };
}