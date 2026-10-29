import { prisma } from "@/lib/prisma";

// Works with the normal client and inside a transaction
type Db = Pick<typeof prisma, "auditLog">;

// Writes one line to the admin activity log. Keep "details" short and never put
// passwords, codes or customers' personal data in it.
export async function logAudit(
  db: Db,
  entry: {
    userId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: string;
    ip?: string;
  }
) {
  await db.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      details: entry.details?.slice(0, 500) ?? null,
      ip: entry.ip ?? null,
    },
  });
}