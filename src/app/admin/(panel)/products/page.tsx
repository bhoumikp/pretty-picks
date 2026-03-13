import { prisma } from "@/lib/prisma";
import AdminProducts from "@/components/admin/admin-products";
import { normalizeImages } from "@/lib/images";

export const revalidate = 0;
export const metadata = {
  title: { absolute: "Admin | Products" },
};

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const mapped = products.map((product) => ({
    ...product,
    images: normalizeImages(product.images),
  }));

  return <AdminProducts products={mapped} categories={categories} />;
}
