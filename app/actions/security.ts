"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, destroyOtherSessions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  checkLimits,
  getClientIp,
  hashKey,
  resetLimit,
  tooManyMessage,
} from "@/lib/rate-limit";
import { auditAs } from "@/lib/audit";

type PasswordResult =
  | { ok: true; signedOut: number }
  | { ok: false; error: string };
type Result = { ok: true; signedOut: number } | { ok: false; error: string };

export async function changePassword(input: {
  current: string;
  next: string;
}): Promise<PasswordResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in first." };

  const current = input.current ?? "";
  const next = input.next ?? "";

  // An admin account can see every order, so its password must be longer
  const minLength = user.role === "ADMIN" ? 12 : 8;

  if (!current) return { ok: false, error: "Enter your current password." };
  if (next.length < minLength || next.length > 128)
    return { ok: false, error: `The new password must be ${minLength} to 128 characters.` };
  if (next === current)
    return { ok: false, error: "The new password must be different from the current one." };

  // Limits stop someone who finds an open browser from guessing the current password
  const ipKey = hashKey(await getClientIp());
  const userKey = `pw-change:user:${user.id}`;
  const limited = await checkLimits([
    { key: userKey, limit: 5, windowSeconds: 15 * 60 },
    { key: `pw-change:ip:${ipKey}`, limit: 20, windowSeconds: 15 * 60 },
  ]);
  if (!limited.allowed)
    return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  try {
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!row || !(await verifyPassword(current, row.passwordHash)))
      return { ok: false, error: "Your current password is not correct." };

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(next) },
    });

    // Every other device has to log in again with the new password
    const signedOut = await destroyOtherSessions(user.id);
    await resetLimit(userKey);

    if (user.role === "ADMIN") {
      await auditAs(user, "security.password", {
        details: `${signedOut} other sessions ended`,
      });
    }

    return { ok: true, signedOut };
  } catch (e) {
    console.error("changePassword failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function signOutOtherDevices(): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in first." };

  const limited = await checkLimits([
    { key: `signout-others:user:${user.id}`, limit: 10, windowSeconds: 60 * 60 },
  ]);
  if (!limited.allowed)
    return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  try {
    const signedOut = await destroyOtherSessions(user.id);

    if (user.role === "ADMIN") {
      await auditAs(user, "security.sessions", { details: `${signedOut} sessions ended` });
    }

    return { ok: true, signedOut };
  } catch (e) {
    console.error("signOutOtherDevices failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}