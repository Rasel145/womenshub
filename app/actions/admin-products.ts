"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { IMAGE_URL_RE } from "@/lib/storage";
import { auditAs } from "@/lib/audit";

type ProductInput = {
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  description: string;
  variants: string[];
  images: string[];
  isActive: boolean;
};

type Result = { ok: true } | { ok: false; error: string };

// Errors with a message that is safe to show to the admin
class ProductError extends Error {}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_IMAGES = 4;

// Checks everything on the server, never trust the browser
function clean(input: ProductInput) {
  const name = input.name?.trim() ?? "";
  const slug = input.slug?.trim().toLowerCase() ?? "";
  const brandName = input.brand?.trim() ?? "";
  const description = input.description?.trim() ?? "";
  const variants = [
    ...new Set((input.variants ?? []).map((v) => v.trim()).filter(Boolean)),
  ];
  const images = input.images ?? [];
  const brandSlug = slugify(brandName);

  if (name.length < 3 || name.length > 120)
    throw new ProductError("Product name must be 3 to 120 characters.");
  if (!SLUG_RE.test(slug) || slug.length > 120)
    throw new ProductError(
      "URL slug can only contain lowercase letters, numbers and hyphens."
    );
  if (brandName.length < 2 || brandName.length > 60 || !brandSlug)
    throw new ProductError("Brand name must be 2 to 60 characters.");
  if (!input.categoryId) throw new ProductError("Select a category.");
  if (!Number.isInteger(input.price) || input.price < 1 || input.price > 1_000_000)
    throw new ProductError("Price must be a whole number between 1 and 1,000,000.");
  if (
    input.oldPrice !== null &&
    (!Number.isInteger(input.oldPrice) ||
      input.oldPrice <= input.price ||
      input.oldPrice > 1_000_000)
  )
    throw new ProductError(
      "Old price must be a whole number higher than the price, or left empty."
    );
  if (!Number.isInteger(input.stock) || input.stock < 0 || input.stock > 100_000)
    throw new ProductError("Stock must be a whole number between 0 and 100,000.");
  if (description.length > 2000)
    throw new ProductError("Description is too long (maximum 2000 characters).");
  if (variants.length > 20 || variants.some((v) => v.length > 40))
    throw new ProductError("Use up to 20 options, each up to 40 characters.");
  if (
    !Array.isArray(images) ||
    images.length > MAX_IMAGES ||
    images.some((u) => typeof u !== "string" || !IMAGE_URL_RE.test(u)) ||
    new Set(images).size !== images.length
  )
    throw new ProductError(`Use up to ${MAX_IMAGES} valid images.`);

  return {
    name,
    slug,
    brandName,
    brandSlug,
    categoryId: input.categoryId,
    price: input.price,
    oldPrice: input.oldPrice,
    stock: input.stock,
    description: description || null,
    variants,
    images,
    isActive: Boolean(input.isActive),
  };
}

function toResult(e: unknown): Result {
  if (e instanceof ProductError) return { ok: false, error: e.message };

  const code = (e as { code?: string }).code;
  if (code === "P2002")
    return { ok: false, error: "A product with this URL slug already exists." };
  if (code === "P2025")
    return { ok: false, error: "Product or category was not found." };

  console.error("product action failed:", e);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createProduct(input: ProductInput): Promise<Result> {
  await requireAdmin();

    const admin = await requireAdmin();
  try {
    const d = clean(input);

    await prisma.product.create({
      data: {
        name: d.name,
        slug: d.slug,
        description: d.description,
        price: d.price,
        oldPrice: d.oldPrice,
        stock: d.stock,
        variants: d.variants,
        images: d.images,
        isActive: d.isActive,
        category: { connect: { id: d.categoryId } },
        brand: {
          connectOrCreate: {
            where: { slug: d.brandSlug },
            create: { slug: d.brandSlug, name: d.brandName },
          },
        },
      },
    });
  } catch (e) {
    return toResult(e);
  }

    await auditAs(admin, "product.create", { details: input.name?.trim().slice(0, 80) });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<Result> {
    const admin = await requireAdmin();

  try {
    const d = clean(input);

    await prisma.product.update({
      where: { id },
      data: {
        name: d.name,
        slug: d.slug,
        description: d.description,
        price: d.price,
        oldPrice: d.oldPrice,
        stock: d.stock,
        variants: d.variants,
        images: d.images,
        isActive: d.isActive,
        category: { connect: { id: d.categoryId } },
        brand: {
          connectOrCreate: {
            where: { slug: d.brandSlug },
            create: { slug: d.brandSlug, name: d.brandName },
          },
        },
      },
    });
  } catch (e) {
    return toResult(e);
  }
  await auditAs(admin, "product.update", {
    targetType: "Product",
    targetId: id,
    details: `${input.name?.trim().slice(0, 60)}, price ${input.price}, stock ${input.stock}`,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  return { ok: true };
}