import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "15") || 15));
  const query = (searchParams.get("q") ?? "").trim();
  const sort = (searchParams.get("sort") ?? "name").trim();
  const dir = (searchParams.get("dir") ?? "asc").trim();
  const type = (searchParams.get("type") ?? "parent").trim();
  const status = (searchParams.get("status") ?? "all").trim();

  const allowedSorts = new Set(["name", "slug", "parent", "status", "createdAt", "updatedAt"]);
  const sortKey = (allowedSorts.has(sort) ? sort : "name") as
    | "name"
    | "slug"
    | "parent"
    | "status"
    | "createdAt"
    | "updatedAt";
  const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";

  const scopeFilter =
    type === "sub"
      ? { parentId: { not: null } }
      : type === "all"
      ? {}
      : { parentId: null };

  const where = {
    archivedAt: null,
    ...scopeFilter,
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
      : sortKey === "parent"
      ? { parent: { name: dirKey } }
      : sortKey === "status"
      ? { active: dirKey }
      : sortKey === "createdAt"
      ? { createdAt: dirKey }
      : { updatedAt: dirKey };

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      orderBy,
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: { parent: true },
    }),
    prisma.category.count({ where }),
  ]);

  const items = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.image ?? null,
    parentId: category.parentId ?? null,
    parentName: category.parent?.name ?? null,
    active: category.active,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }));

  return NextResponse.json({ items, total });
}
