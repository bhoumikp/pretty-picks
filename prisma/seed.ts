import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@prettypicks.in";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "PrettyPicks123";
  const hashed = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashed },
    create: { email: adminEmail, password: hashed },
  });

  const categories = [
    { name: "Earrings", image: "/images/category-earrings.svg" },
    { name: "Necklaces", image: "/images/category-necklaces.svg" },
    { name: "Rings", image: "/images/category-rings.svg" },
    { name: "Bangles", image: "/images/category-bangles.svg" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(category.name) },
      update: { image: category.image, name: category.name },
      create: {
        name: category.name,
        slug: slugify(category.name),
        image: category.image,
      },
    });
  }

  const categoryMap = await prisma.category.findMany();
  const bySlug = new Map(categoryMap.map((c) => [c.slug, c.id]));

  const products = [
    {
      name: "Golden Bloom Studs",
      price: 149,
      description:
        "Delicate floral studs with a warm gold finish, perfect for daily wear.",
      material: "Alloy, anti-tarnish coating",
      categorySlug: "earrings",
      stock: 24,
      images: [{ url: "/images/product-1.svg" }],
    },
    {
      name: "Pearl Drop Earrings",
      price: 199,
      description:
        "Soft pearl drops with a minimal silhouette for effortless styling.",
      material: "Alloy, faux pearl",
      categorySlug: "earrings",
      stock: 18,
      images: [{ url: "/images/product-2.svg" }],
    },
    {
      name: "Moonstone Chain Necklace",
      price: 179,
      description:
        "Lightweight chain necklace with a moonstone-inspired charm.",
      material: "Alloy, enamel charm",
      categorySlug: "necklaces",
      stock: 32,
      images: [{ url: "/images/product-3.svg" }],
    },
    {
      name: "Stackable Rings Set",
      price: 189,
      description:
        "Set of three stackable rings in a muted gold finish.",
      material: "Alloy",
      categorySlug: "rings",
      stock: 40,
      images: [{ url: "/images/product-4.svg" }],
    },
    {
      name: "Textured Hoop Bangles",
      price: 169,
      description:
        "Lightweight bangles with a textured shine for festive looks.",
      material: "Alloy",
      categorySlug: "bangles",
      stock: 20,
      images: [{ url: "/images/product-5.svg" }],
    },
    {
      name: "Petal Charm Necklace",
      price: 159,
      description:
        "Petal-inspired charm with a dainty chain for a soft feminine look.",
      material: "Alloy, enamel",
      categorySlug: "necklaces",
      stock: 26,
      images: [{ url: "/images/product-6.svg" }],
    },
  ];

  for (const product of products) {
    const categoryId = bySlug.get(product.categorySlug);
    if (!categoryId) continue;

    await prisma.product.upsert({
      where: { slug: slugify(product.name) },
      update: {
        price: product.price,
        description: product.description,
        material: product.material,
        categoryId,
        stock: product.stock,
        images: product.images,
      },
      create: {
        name: product.name,
        slug: slugify(product.name),
        price: product.price,
        description: product.description,
        material: product.material,
        categoryId,
        stock: product.stock,
        images: product.images,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
