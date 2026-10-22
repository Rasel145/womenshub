import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

// Shown in this order everywhere: display order first, then A to Z
const order = [{ position: "asc" as const }, { name: "asc" as const }];

export async function getCategories() {
  await connection(); // always read fresh data
  return prisma.category.findMany({
    orderBy: order,
    select: { id: true, slug: true, name: true },
  });
}

export async function getCategoryBySlug(slug: string) {
  await connection();
  return prisma.category.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true },
  });
}