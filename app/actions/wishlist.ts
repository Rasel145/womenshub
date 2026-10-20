"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const MAX_ITEMS = 200;

type SetResult = { ok: true } | { ok: false; error: "login" | "failed" };

// Used by the heart buttons to know which products are already saved
export async function getWishlistIds(): Promise<{ loggedIn: boolean; ids: string[] }> {
  const user = await getCurrentUser();
  if (!user) return { loggedIn: false, ids: [] };

  const rows = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    select: { productId: true },
  });
  return { loggedIn: true, ids: rows.map((r) => r.productId) };
}

// "wanted" says what the customer wants (saved or not saved), so pressing the
// button twice quickly can never flip it the wrong way
export async function setWishlisted(
  productId: string,
  wanted: boolean
): Promise<SetResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "login" };

  if (typeof productId !== "string" || productId.length === 0 || productId.length > 40)
    return { ok: false, error: "failed" };

  try {
    if (wanted) {
      const existing = await prisma.wishlistItem.findUnique({
        where: { userId_productId: { userId: user.id, productId } },
        select: { id: true },
      });

      if (!existing) {
        const product = await prisma.product.findFirst({
          where: { id: productId, isActive: true },
          select: { id: true },
        });
        if (!product) return { ok: false, error: "failed" };

        const count = await prisma.wishlistItem.count({ where: { userId: user.id } });
        if (count >= MAX_ITEMS) return { ok: false, error: "failed" };

        try {
          await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
        } catch (e) {
          // P2002 = it was saved a moment ago by another click, which is fine
          if ((e as { code?: string }).code !== "P2002") throw e;
        }
      }
    } else {
      await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
    }
  } catch (e) {
    console.error("setWishlisted failed:", e);
    return { ok: false, error: "failed" };
  }

  revalidatePath("/wishlist");
  return { ok: true };
}