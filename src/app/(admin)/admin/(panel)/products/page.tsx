import { Prisma } from "@prisma/client";
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
  searchParams?: Promise<{ page?: string; q?: string; sort?: string; dir?: string; status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const pageSize = 15;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const query = (params.q ?? "").trim();
  const sort = (params.sort ?? "updatedAt").trim();
  const dir = (params.dir ?? "desc").trim();
  const status = (params.status ?? "all").trim();
  const allowedSorts = new Set(["name", "category", "price", "stock", "status", "updatedAt"]);
  const sortKey = (allowedSorts.has(sort) ? sort : "updatedAt") as
    | "name"
    | "category"
    | "price"
    | "stock"
    | "status"
    | "updatedAt";
  const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";

  const statusFilter =
    status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {};

  const where = {
    archivedAt: null,
    ...statusFilter,
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { category: { name: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;
  let products: ProductWithCategory[] = [];
  let total = 0;
  let dbUnavailable = false;

  const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
    if (sortKey === "name") return { name: dirKey };
    if (sortKey === "category") return { category: { name: dirKey } };
    if (sortKey === "price") return { price: dirKey };
    if (sortKey === "stock") return { stock: dirKey };
    if (sortKey === "status") return { isActive: dirKey };
    return { updatedAt: dirKey };
  })();

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
      isActive: product.isActive,
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
        initialSort={[sortKey]}
        initialDir={[dirKey]}
        initialStatus={
          status === "active" || status === "inactive" ? (status as "active" | "inactive") : "all"
        }
      />
    </div>
  );
}
