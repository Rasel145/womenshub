import { prisma } from "@/lib/prisma";

export type AdminCounts = {
  pending: number; // orders waiting for confirmation
  unseen: number; // pending orders the admin has not opened yet
};

export async function getAdminCounts(): Promise<AdminCounts> {
  const [pending, unseen] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PENDING", adminSeenAt: null } }),
  ]);

  return { pending, unseen };
}