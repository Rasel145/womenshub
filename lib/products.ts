        import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "../generated/prisma/client";
import type { Product } from "@/types";

const include = { brand: true, category: true } as const;

type DbProduct = Prisma.ProductGetPayload<{ include: typeof include }>;

function toProduct(p: DbProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand.name,
    category: p.category.slug,
    price: p.price,
    oldPrice: p.oldPrice ?? undefined,
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.stock > 0,
    description: p.description ?? undefined,
    variants: p.variants.length > 0 ? p.variants : undefined,
  };
}

export async function getProducts(): Promise<Product[]> {
  await connection(); // always fetch fresh data on each request
  const rows = await prisma.product.findMany({
    include,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toProduct);
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  await connection();
  const rows = await prisma.product.findMany({
    where: { category: { slug } },
    include,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await connection();
  const row = await prisma.product.findUnique({ where: { slug }, include });
  return row ? toProduct(row) : null;
}