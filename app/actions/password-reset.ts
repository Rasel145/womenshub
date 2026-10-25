"use server";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendPasswordResetCode } from "@/lib/notify";
import { checkLimits, getClientIp, hashKey, tooManyMessage } from "@/lib/rate-limit"; // NEW

type Result = { ok: true } | { ok: false; error: string };

const PHONE_RE = /^01[3-9]\d{8}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const CODE_MINUTES = 10;
const RESEND_SECONDS = 60;
const MAX_REQUESTS_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

function hashCode(userId: string, code: string) {
  return createHash("sha256").update(`${userId}:${code}`).digest("hex");
}

function validIdentifier(id: string) {
  return PHONE_RE.test(id) || EMAIL_RE.test(id);
}

function findUser(identifier: string) {
  return identifier.includes("@")
    ? prisma.user.findUnique({ where: { email: identifier.toLowerCase() } })
    : prisma.user.findUnique({ where: { phone: identifier } });
}

export async function requestPasswordReset(rawIdentifier: string): Promise<Result> {
  const identifier = rawIdentifier?.trim() ?? "";
  if (!validIdentifier(identifier))
    return { ok: false, error: "Enter a valid mobile number or email." };

  // NEW: at most 10 code requests per hour from one IP.
  // The answer does not depend on whether the account exists.
  const ipKey = hashKey(await getClientIp());
  const limited = await checkLimits([
    { key: `reset-request:ip:${ipKey}`, limit: 10, windowSeconds: 60 * 60 },
  ]);
  if (!limited.allowed)
    return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  try {
    const user = await findUser(identifier);

    if (user) {
      const now = Date.now();
      const [latest, lastHour] = await Promise.all([
        prisma.passwordReset.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        }),
        prisma.passwordReset.count({
          where: { userId: user.id, createdAt: { gt: new Date(now - 60 * 60 * 1000) } },
        }),
      ]);

      const tooSoon =
        latest && now - latest.createdAt.getTime() < RESEND_SECONDS * 1000;

      if (!tooSoon && lastHour < MAX_REQUESTS_PER_HOUR) {
        const code = String(randomInt(100000, 1000000));

        await prisma.passwordReset.create({
          data: {
            userId: user.id,
            codeHash: hashCode(user.id, code),
            expiresAt: new Date(now + CODE_MINUTES * 60 * 1000),
          },
        });

        // Remove very old codes
        await prisma.passwordReset.deleteMany({
          where: {
            userId: user.id,
            createdAt: { lt: new Date(now - 24 * 60 * 60 * 1000) },
          },
        });

        await sendPasswordResetCode(
          user,
          code,
          identifier.includes("@") ? "email" : "phone"
        );
      }
    }
  } catch (e) {
    console.error("requestPasswordReset failed:", e);
  }

  // The answer is the same whether or not the account exists
  return { ok: true };
}

export async function confirmPasswordReset(input: {
  identifier: string;
  code: string;
  password: string;
}): Promise<Result> {
  const identifier = input.identifier?.trim() ?? "";
  const code = input.code?.trim() ?? "";
  const password = input.password ?? "";

  const invalid: Result = {
    ok: false,
    error: "This code is incorrect or has expired. Request a new code and try again.",
  };

  if (!validIdentifier(identifier))
    return { ok: false, error: "Enter a valid mobile number or email." };
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit code." };
  if (password.length < 8 || password.length > 128)
    return { ok: false, error: "Password must be 8 to 128 characters." };

  // NEW: slows down anyone trying to guess the 6-digit code
  const ipKey = hashKey(await getClientIp());
  const idKey = hashKey(identifier.toLowerCase());
  const limited = await checkLimits([
    { key: `reset-confirm:ip:${ipKey}`, limit: 20, windowSeconds: 15 * 60 },
    { key: `reset-confirm:id:${idKey}`, limit: 10, windowSeconds: 15 * 60 },
  ]);
  if (!limited.allowed)
    return { ok: false, error: tooManyMessage(limited.retryAfterSeconds) };

  try {
    const user = await findUser(identifier);
    if (!user) return invalid;

    // Only the newest code can be used
    const reset = await prisma.passwordReset.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (!reset) return invalid;

    // Count this guess first, so many guesses at the same moment cannot beat the limit
    const claimed = await prisma.passwordReset.updateMany({
      where: {
        id: reset.id,
        attempts: { lt: MAX_ATTEMPTS },
        expiresAt: { gt: new Date() },
      },
      data: { attempts: { increment: 1 } },
    });
    if (claimed.count === 0) return invalid;

    const given = Buffer.from(hashCode(user.id, code), "hex");
    const expected = Buffer.from(reset.codeHash, "hex");
    if (given.length !== expected.length || !timingSafeEqual(given, expected))
      return invalid;

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      // Log the user out of every device
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.passwordReset.deleteMany({ where: { userId: user.id } }),
    ]);

    return { ok: true };
  } catch (e) {
    console.error("confirmPasswordReset failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}