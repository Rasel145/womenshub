import { prisma } from "../lib/prisma";
import { products } from "../data/products";

const categories = [
  { slug: "skincare", name: "Skincare" },
  { slug: "makeup", name: "Makeup" },
  { slug: "haircare", name: "Haircare" },
  { slug: "fragrance", name: "Fragrance" },
  { slug: "bath-body", name: "Bath & Body" },
];

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  for (const p of products) {
    const brandSlug = slugify(p.brand);

    await prisma.brand.upsert({
      where: { slug: brandSlug },
      update: {},
      create: { slug: brandSlug, name: p.brand },
    });

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice,
        rating: p.rating,
        reviewCount: p.reviewCount,
        stock: p.inStock ? 50 : 0,
        variants: p.variants ?? [],
        category: { connect: { slug: p.category } },
        brand: { connect: { slug: brandSlug } },
      },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });