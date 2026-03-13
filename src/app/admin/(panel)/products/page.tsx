import { prisma } from "@/lib/prisma";
import { normalizeImages } from "@/lib/images";
import AdminProductsClient from "@/components/admin/admin-products-client";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Admin | Products" },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: { page?: string; q?: string; sort?: string; dir?: string };
}) {
  const pageSize = 15;
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const query = (searchParams?.q ?? "").trim();
  const sort = (searchParams?.sort ?? "updatedAt").trim();
  const dir = (searchParams?.dir ?? "desc").trim();
  const allowedSorts = new Set(["name", "category", "price", "stock", "status", "updatedAt"]);
  const sortKeys = sort
    .split(",")
    .map((value) => value.trim())
    .filter((value) => allowedSorts.has(value));
  const dirKeys = dir.split(",").map((value) => (value === "asc" ? "asc" : "desc"));
  if (!sortKeys.length) sortKeys.push("updatedAt");
  while (dirKeys.length < sortKeys.length) dirKeys.push("desc");

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { category: { name: { contains: query, mode: "insensitive" as const } } },
        ],
      }
    : undefined;

  let products: Array<
    Awaited<ReturnType<typeof prisma.product.findMany>>[number]
  > = [];
  let total = 0;
  let dbUnavailable = false;

  const orderBy = sortKeys.map((key, index) => {
    const direction = (dirKeys[index] ?? "desc") as "asc" | "desc";
    if (key === "name") return { name: direction };
    if (key === "category") return { category: { name: direction } };
    if (key === "price") return { price: direction };
    if (key === "stock") return { stock: direction };
    if (key === "status") return { stock: direction };
    return { updatedAt: direction };
  });

  try {
    const [productsResult, totalResult] = await Promise.all([
      prisma.product.findMany({
        include: { category: true },
        orderBy,
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    products = productsResult;
    total = totalResult;
  } catch (error) {
    console.error("Admin products DB error:", error);
    dbUnavailable = true;
  }

  const mapped = products.map((product) => {
    const images = normalizeImages(product.images);
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      categoryName: product.category?.name ?? null,
      image: images[0] ?? null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  });

  return (
    <div className="grid gap-6">
      {dbUnavailable && <OfflineBanner />}
      <AdminProductsClient
        initialProducts={mapped}
        initialTotal={total}
        initialPage={page}
        pageSize={pageSize}
        initialQuery={query}
        initialSort={sortKeys}
        initialDir={dirKeys}
      />
    </div>
  );
}
