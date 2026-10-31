"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { auditAs } from "@/lib/audit";

type Result = { ok: true } | { ok: false; error: string };

const PHONE_RE = /^01[3-9]\d{8}$/;

export async function blockPhone(phone: string, reason: string): Promise<Result> {
  const admin = await requireAdmin();

  const p = phone?.trim() ?? "";
  const r = reason?.trim() ?? "";

  if (!PHONE_RE.test(p)) return { ok: false, error: "Enter a valid mobile number." };
  if (r.length > 200)
    return { ok: false, error: "The reason can be up to 200 characters." };

  try {
    await prisma.blockedPhone.upsert({
      where: { phone: p },
      update: { reason: r || null },
      create: { phone: p, reason: r || null, createdById: admin.id },
    });
  } catch (e) {
    console.error("blockPhone failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Only the last 4 digits go into the log
  await auditAs(admin, "phone.block", { details: `number ending ${p.slice(-4)}` });

  revalidatePath("/admin/blocked");
  return { ok: true };
}

export async function unblockPhone(id: string): Promise<Result> {
  const admin = await requireAdmin();

  if (typeof id !== "string" || id.length === 0 || id.length > 40)
    return { ok: false, error: "Not found." };

  try {
    const removed = await prisma.blockedPhone.delete({
      where: { id },
      select: { phone: true },
    });
    await auditAs(admin, "phone.unblock", {
      details: `number ending ${removed.phone.slice(-4)}`,
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2025")
      return { ok: false, error: "This number is not blocked anymore." };
    console.error("unblockPhone failed:", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  revalidatePath("/admin/blocked");
  return { ok: true };
}