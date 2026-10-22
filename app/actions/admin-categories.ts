"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type CategoryInput = {
  name: string;
  slug: string;
  position: number;
};

type Result = { ok: true } | { ok: false; error: string };

// Errors with a message that is safe to show to the admin
class CategoryError extends Error {}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Checks everything on the server, never trust the browser
function clean(input: CategoryInput) {
  const name = input.name?.trim() ?? "";
  const slug = input.slug?.trim().toLowerCase() ?? "";

  if (name.length < 2 || name.length > 40)
    throw new CategoryError("Category name must be 2 to 40 characters.");
  if (!SLUG_RE.test(slug) || slug.length > 60)
    throw new CategoryError(
      "URL slug can only contain lowercase letters, numbers and hyphens."
    );
  if (!Number.isInteger(input.position) || input.position < 0 || input.position > 999)
    throw new CategoryError("Display order must be a whole number from 0 to 999.");

  return { name, slug, position: input.position };
}

function toResult(e: unknown): Result {
  if (e instanceof CategoryError) return { ok: false, error: e.message };

  const code = (e as { code?: string }).code;
  if (code === "P2002")
    return { ok: false, error: "A category with this URL slug already exists." };
  if (code === "P2025") return { ok: false, error: "Category was not found." };

  console.error("category action failed:", e);
  return { ok: false, error: "Something went wrong. Please try again." };
}

// Two categories should not have the same name (capital or small letters)
async function assertNameFree(name: string, ignoreId?: string) {
  const same = await prisma.category.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(ignoreId && { NOT: { id: ignoreId } }),
    },
    select: { id: true },
  });
  if (same) throw new CategoryError("A category with this name already exists.");
}

export async function createCategory(input: CategoryInput): Promise<Result> {
  await requireAdmin();

  try {
    const d = clean(input);
    await assertNameFree(d.name);
    await prisma.category.create({ data: d });
  } catch (e) {
    return toResult(e);
  }

  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<Result> {
  await requireAdmin();

  try {
    const d = clean(input);
    await assertNameFree(d.name, id);
    await prisma.category.update({ where: { id }, data: d });
  } catch (e) {
    return toResult(e);
  }

  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${id}/edit`);
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<Result> {
  await requireAdmin();

  try {
    const products = await prisma.product.count({ where: { categoryId: id } });
    if (products > 0)
      throw new CategoryError(
        `This category still has ${products} ${
          products === 1 ? "product" : "products"
        }. Move them to another category first.`
      );

    await prisma.category.delete({ where: { id } });
  } catch (e) {
    // P2003 = a product was added to this category a moment ago
    if ((e as { code?: string }).code === "P2003")
      return {
        ok: false,
        error: "This category still has products. Move them to another category first.",
      };
    return toResult(e);
  }

  revalidatePath("/admin/categories");
  return { ok: true };
}