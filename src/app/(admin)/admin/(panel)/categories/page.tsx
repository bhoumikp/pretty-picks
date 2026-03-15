import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminCategories from "@/components/admin/admin-categories";
import AdminSubcategories from "@/components/admin/admin-subcategories";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Admin | Categories" },
};

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    sort?: string;
    dir?: string;
    status?: string;
    tab?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const tab = params.tab === "subcategories" ? "subcategories" : "categories";
  const pageSize = 15;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const query = (params.q ?? "").trim();
  const sort = (params.sort ?? (tab === "subcategories" ? "updatedAt" : "name")).trim();
  const dir = (params.dir ?? (tab === "subcategories" ? "desc" : "asc")).trim();
  const rawStatus = (params.status ?? "all").trim();
  const allowedSorts = new Set(
    tab === "subcategories"
      ? ["name", "slug", "parent", "status", "createdAt", "updatedAt"]
      : ["name", "slug", "status", "createdAt", "updatedAt"]
  );
  const sortKey = (allowedSorts.has(sort) ? sort : tab === "subcategories" ? "updatedAt" : "name") as
    | "name"
    | "slug"
    | "parent"
    | "status"
    | "createdAt"
    | "updatedAt";
  const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";
  const allowedStatuses = new Set(["all", "active", "inactive"]);
  const status = allowedStatuses.has(rawStatus) ? rawStatus : "all";

  const where =
    tab === "subcategories"
      ? {
          parentId: { not: null },
          ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
          ...(query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" as const } },
                  { slug: { contains: query, mode: "insensitive" as const } },
                  { parent: { name: { contains: query, mode: "insensitive" as const } } },
                ],
              }
            : {}),
        }
      : {
          parentId: null,
          ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
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
    : sortKey === "parent"
    ? { parent: { name: dirKey } }
    : sortKey === "status"
    ? { isActive: dirKey }
    : sortKey === "createdAt"
      ? { createdAt: dirKey }
      : { updatedAt: dirKey };

  type CategoryRow = Prisma.CategoryGetPayload<{
    select: {
      id: true;
      name: true;
      slug: true;
      image: true;
      isActive: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;
  type SubcategoryRow = Prisma.CategoryGetPayload<{
    select: {
      id: true;
      name: true;
      slug: true;
      image: true;
      isActive: true;
      parentId: true;
      parent: { select: { name: true } };
      createdAt: true;
      updatedAt: true;
    };
  }>;
  let categories: CategoryRow[] = [];
  let subcategories: SubcategoryRow[] = [];
  let parentOptions: Array<{ id: string; name: string }> = [];
  let total = 0;
  let dbUnavailable = false;

  try {
    if (tab === "subcategories") {
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
            isActive: true,
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
    } else {
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
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.category.count({ where }),
      ]);
      categories = categoriesResult;
      total = totalResult;
    }
  } catch (error) {
    console.error("Admin categories DB error:", error);
    dbUnavailable = true;
  }

  const mapped = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.image ?? null,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }));

  const mappedSub = subcategories.map((subcategory) => ({
    id: subcategory.id,
    name: subcategory.name,
    slug: subcategory.slug,
    image: subcategory.image ?? null,
    isActive: subcategory.isActive,
    parentId: subcategory.parentId ?? null,
    parentName: subcategory.parent?.name ?? null,
    createdAt: subcategory.createdAt.toISOString(),
    updatedAt: subcategory.updatedAt.toISOString(),
  }));

  return (
    <div className="grid gap-4">
      {dbUnavailable && <OfflineBanner />}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--pp-border)] pb-2 text-xs text-[var(--pp-muted)]">
        <Link
          href="/admin/categories?tab=categories"
          className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] transition ${
            tab === "categories"
              ? "border-b-2 border-[var(--pp-gold)] text-[var(--pp-ink)]"
              : "text-[var(--pp-muted)] hover:text-[var(--pp-ink)]"
          }`}
        >
          Categories
        </Link>
        <Link
          href="/admin/categories?tab=subcategories"
          className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] transition ${
            tab === "subcategories"
              ? "border-b-2 border-[var(--pp-gold)] text-[var(--pp-ink)]"
              : "text-[var(--pp-muted)] hover:text-[var(--pp-ink)]"
          }`}
        >
          Sub Categories
        </Link>
      </div>
      {tab === "subcategories" ? (
        <AdminSubcategories
          initialSubcategories={mappedSub}
          initialTotal={total}
          initialPage={page}
          pageSize={pageSize}
          initialQuery={query}
          initialSort={[sortKey]}
          initialDir={[dirKey]}
          initialStatus={status as "all" | "active" | "inactive"}
          parentOptions={parentOptions}
        />
      ) : (
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
      )}
    </div>
  );
}
