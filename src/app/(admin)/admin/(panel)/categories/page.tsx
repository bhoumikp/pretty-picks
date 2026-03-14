import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import AdminCategories from "@/components/admin/admin-categories";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Admin | Categories" },
};

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; q?: string; sort?: string; dir?: string; status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const pageSize = 15;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const query = (params.q ?? "").trim();
  const sort = (params.sort ?? "name").trim();
  const dir = (params.dir ?? "asc").trim();
  const rawStatus = (params.status ?? "all").trim();
  const allowedSorts = new Set(["name", "slug", "status", "createdAt", "updatedAt"]);
  const sortKey = (allowedSorts.has(sort) ? sort : "name") as
    | "name"
    | "slug"
    | "status"
    | "createdAt"
    | "updatedAt";
  const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";
  const allowedStatuses = new Set(["all", "active", "inactive"]);
  const status = allowedStatuses.has(rawStatus) ? rawStatus : "all";

  const where = {
    parentId: null,
    ...(status === "active" ? { active: true } : status === "inactive" ? { active: false } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { slug: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.CategoryOrderByWithRelationInput =
    sortKey === "name"
      ? { name: dirKey }
      : sortKey === "slug"
      ? { slug: dirKey }
    : sortKey === "status"
    ? { active: dirKey }
    : sortKey === "createdAt"
      ? { createdAt: dirKey }
      : { updatedAt: dirKey };

  type CategoryRow = Prisma.CategoryGetPayload<{
    select: {
      id: true;
      name: true;
      slug: true;
      image: true;
      active: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;
  let categories: CategoryRow[] = [];
  let total = 0;
  let dbUnavailable = false;

  try {
    const [categoriesResult, totalResult] = await Promise.all([
      prisma.category.findMany({
        orderBy,
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.category.count({ where }),
    ]);
    categories = categoriesResult;
    total = totalResult;
  } catch (error) {
    console.error("Admin categories DB error:", error);
    dbUnavailable = true;
  }

  const mapped = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.image ?? null,
    active: category.active,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }));

  return (
    <div className="grid gap-4">
      {dbUnavailable && <OfflineBanner />}
      <AdminCategories
        initialCategories={mapped}
        initialTotal={total}
        initialPage={page}
        pageSize={pageSize}
        initialQuery={query}
        initialSort={[sortKey]}
        initialDir={[dirKey]}
        initialStatus={status as "all" | "active" | "inactive"}
      />
    </div>
  );
}
