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
    images: p.images.length > 0 ? p.images : undefined,
  };
}

export async function getProducts(): Promise<Product[]> {
  await connection(); // always fetch fresh data on each request
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    include,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toProduct);
}

// Newest products first, used on the homepage
export async function getLatestProducts(limit = 8): Promise<Product[]> {
  await connection();
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    include,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toProduct);
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  await connection();
  const rows = await prisma.product.findMany({
    where: { isActive: true, category: { slug } },
    include,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await connection();
  const row = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include,
  });
  return row ? toProduct(row) : null;
}

// Every word must match the name, brand, category or description
export async function searchProducts(query: string, limit = 60): Promise<Product[]> {
  await connection();

  const terms = query.split(/\s+/).filter(Boolean).slice(0, 5);

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      AND: terms.map((term) => ({
        OR: [
          { name: { contains: term, mode: "insensitive" as const } },
          { brand: { name: { contains: term, mode: "insensitive" as const } } },
          { category: { name: { contains: term, mode: "insensitive" as const } } },
          { description: { contains: term, mode: "insensitive" as const } },
        ],
      })),
    },
    include,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(toProduct);
}

// Products with the best average rating (only products that have reviews)
export async function getTopRatedProducts(limit = 4): Promise<Product[]> {
  await connection();

  const rows = await prisma.product.findMany({
    where: { isActive: true, reviewCount: { gt: 0 } },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    take: limit,
    include,
  });

  return rows.map(toProduct);
}

// Products that sold the most pieces (cancelled orders are not counted)
export async function getBestSellerProducts(limit = 4): Promise<Product[]> {
  await connection();

  const top = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { status: { not: "CANCELLED" } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit * 2, // some of them may be hidden, so take extra
  });
  if (top.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: { id: { in: top.map((t) => t.productId) }, isActive: true },
    include,
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  return top
    .map((t) => byId.get(t.productId))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .slice(0, limit)
    .map(toProduct);
}