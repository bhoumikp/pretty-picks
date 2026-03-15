import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminProductForm from "@/components/admin/admin-products";
import { normalizeImages } from "@/lib/images";
import OfflineBanner from "@/components/admin/offline-banner";

export const metadata = {
  title: { absolute: "Admin | Edit Product" },
};

interface RouteContext {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function AdminProductEditPage({ params }: RouteContext) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;

  if (!id) {
    notFound();
  }

  let product: Awaited<ReturnType<typeof prisma.product.findUnique>> | null = null;
  let categories: Array<
    Awaited<ReturnType<typeof prisma.category.findMany>>[number]
  > = [];
  let dbUnavailable = false;

  try {
    const [productResult, categoriesResult] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: { category: true },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);
    product = productResult;
    categories = categoriesResult;
  } catch (error) {
    console.error("Admin product edit DB error:", error);
    dbUnavailable = true;
  }

  if (!product && !dbUnavailable) {
    notFound();
  }

  const images = product ? normalizeImages(product.images) : [];

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Catalog</p>
        <h2 className="text-2xl font-[var(--font-heading)]">Edit product</h2>
      </div>
      {dbUnavailable && <OfflineBanner message="Database is currently unreachable. You can still view this form, but saving may fail." />}
      <AdminProductForm
        categories={categories}
        initialProduct={
          product
            ? {
                id: product.id,
                name: product.name,
                price: product.price,
                description: product.description,
                material: product.material,
                images,
                stock: product.stock,
                categoryId: product.categoryId,
              }
            : undefined
        }
      />
    </div>
  );
}
