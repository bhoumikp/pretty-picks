import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import AdminSubcategories from "@/components/admin/admin-subcategories";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Admin | Sub Categories" },
};

export default async function AdminSubcategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const pageSize = 15;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const query = (params.q ?? "").trim();
  const sort = (params.sort ?? "updatedAt").trim();
  const dir = (params.dir ?? "desc").trim();
  const allowedSorts = new Set(["name", "slug", "parent", "status", "createdAt", "updatedAt"]);
  const sortKey = (allowedSorts.has(sort) ? sort : "updatedAt") as
    | "name"
    | "slug"
    | "parent"
    | "status"
    | "createdAt"
    | "updatedAt";
  const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";

  const where = {
    parentId: { not: null },
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { slug: { contains: query, mode: "insensitive" as const } },
            { parent: { name: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.CategoryOrderByWithRelationInput =
    sortKey === "name"
      ? { name: dirKey }
      : sortKey === "slug"
      ? { slug: dirKey }
      : sortKey === "parent"
      ? { parent: { name: dirKey } }
    : sortKey === "status"
    ? { active: dirKey }
    : sortKey === "createdAt"
      ? { createdAt: dirKey }
      : { updatedAt: dirKey };

  let subcategories: Array<
    Prisma.CategoryGetPayload<{
      select: {
        id: true;
        name: true;
        slug: true;
        image: true;
        active: true;
        parentId: true;
        parent: { select: { name: true } };
        createdAt: true;
        updatedAt: true;
      };
    }>
  > = [];
  let total = 0;
  let dbUnavailable = false;

  let parentOptions: Array<{ id: string; name: string }> = [];

  try {
    const [subcategoriesResult, totalResult, parentsResult] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy,
        take: pageSize,
        skip: (page - 1) * pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          active: true,
          parentId: true,
          parent: { select: { name: true } },
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.category.count({ where }),
      prisma.category.findMany({
        where: { parentId: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    subcategories = subcategoriesResult;
    total = totalResult;
    parentOptions = parentsResult;
  } catch (error) {
    console.error("Admin sub categories DB error:", error);
    dbUnavailable = true;
  }

  const mapped = subcategories.map((subcategory) => ({
    id: subcategory.id,
    name: subcategory.name,
    slug: subcategory.slug,
    image: subcategory.image ?? null,
    active: subcategory.active,
    parentId: subcategory.parentId ?? null,
    parentName: subcategory.parent?.name ?? null,
    createdAt: subcategory.createdAt.toISOString(),
    updatedAt: subcategory.updatedAt.toISOString(),
  }));

  return (
    <div className="grid gap-4">
      {dbUnavailable && <OfflineBanner />}
      <AdminSubcategories
        initialSubcategories={mapped}
        initialTotal={total}
        initialPage={page}
        pageSize={pageSize}
        initialQuery={query}
        initialSort={[sortKey]}
        initialDir={[dirKey]}
        parentOptions={parentOptions}
      />
    </div>
  );
}
