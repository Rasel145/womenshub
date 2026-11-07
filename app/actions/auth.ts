"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/auth";
import {
  checkLimits,
  getClientIp,
  hashKey,
  resetLimit,
  tooManyMessage,
} from "@/lib/rate-limit";
import { GENDERS, ageFromIsoDate, parseIsoDate } from "@/lib/profile";

type ActionResult = { ok: true } | { ok: false; error: string };

const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Used so login takes a similar time even when the account does not exist
const dummyHash = hashPassword("not-a-real-password");

export async function registerAction(input: {
  name: string;
  phone: string;
  email?: string;
  password: string;
  gender?: string;
  dateOfBirth?: string;
}): Promise<ActionResult> {
  const name = input.name?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() || undefined;
  const password = input.password ?? "";
  const gender = input.gender?.trim() ?? "";
  const dob = input.dateOfBirth?.trim() ?? "";

  // At most 10 sign-ups per hour from one IP
  const ipKey = hashKey(await getClientIp());
  const limited = await checkLimits([
    { key: `register:ip:${ipKey}`, limit: 10, windowSeconds: 60 * 60 },
  ]);
  if (!limited.allowed)
    return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  // Everything is checked here on the server, never trust the browser
  if (name.length < 3 || name.length > 80)
    return { ok: false, error: "Enter your full name." };
  if (!PHONE_RE.test(phone))
    return { ok: false, error: "Enter a valid mobile number." };
  if (email && !EMAIL_RE.test(email))
    return { ok: false, error: "Enter a valid email address." };
  if (password.length < 8 || password.length > 128)
    return { ok: false, error: "Password must be 8 to 128 characters." };
  if (gender && !GENDERS.some((g) => g.value === gender))
    return { ok: false, error: "Choose a gender from the list." };

  let dateOfBirth: Date | null = null;
  if (dob) {
    dateOfBirth = parseIsoDate(dob);
    const age = ageFromIsoDate(dob);
    if (!dateOfBirth || age === null || age < 10 || age > 100)
      return { ok: false, error: "Enter a valid date of birth." };
  }

  const exists: ActionResult = {
    ok: false,
    error: "An account with this mobile number or email already exists.",
  };

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    select: { id: true },
  });
  if (existing) return exists;

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email: email ?? null,
        passwordHash: await hashPassword(password),
        gender: gender || null,
        dateOfBirth,
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (e) {
    // P2002 = unique constraint (two people registering at the same moment)
    if ((e as { code?: string }).code === "P2002") return exists;
    console.error("register failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // The new customer is signed in. The page then uploads the optional photo and goes on.
  await createSession(userId);
  return { ok: true };
}

export async function loginAction(input: {
  identifier: string;
  password: string;
}): Promise<ActionResult> {
  const identifier = input.identifier?.trim() ?? "";
  const password = input.password ?? "";

  // Same message for "no account" and "wrong password"
  const invalid: ActionResult = {
    ok: false,
    error: "Incorrect mobile number, email or password.",
  };

  if (!identifier || !password || password.length > 128) return invalid;

  // Three limits, checked BEFORE the slow password check
  const ipKey = hashKey(await getClientIp());
  const idKey = hashKey(identifier.toLowerCase());
  const pairKey = `login:ip-id:${ipKey}:${idKey}`;

  const limited = await checkLimits([
    { key: `login:ip:${ipKey}`, limit: 30, windowSeconds: 15 * 60 },
    { key: pairKey, limit: 5, windowSeconds: 15 * 60 },
    { key: `login:id:${idKey}`, limit: 30, windowSeconds: 60 * 60 },
  ]);
  if (!limited.allowed)
    return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  const user = identifier.includes("@")
    ? await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
    : await prisma.user.findUnique({ where: { phone: identifier } });

  const valid = await verifyPassword(
    password,
    user ? user.passwordHash : await dummyHash
  );
  if (!user || !valid) return invalid;

  // A correct password clears this person's failed-attempt counter
  await resetLimit(pairKey);

  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : "/account");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}