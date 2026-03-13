import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { normalizeImages } from "@/lib/images";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "15") || 15));
  const query = (searchParams.get("q") ?? "").trim();
  const sort = (searchParams.get("sort") ?? "updatedAt").trim();
  const dir = (searchParams.get("dir") ?? "desc").trim();

  const allowedSorts = new Set(["name", "category", "price", "stock", "status", "updatedAt"]);
  const sortKey = (allowedSorts.has(sort) ? sort : "updatedAt") as
    | "name"
    | "category"
    | "price"
    | "stock"
    | "status"
    | "updatedAt";
  const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { category: { name: { contains: query, mode: "insensitive" as const } } },
        ],
      }
    : undefined;

  const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
    if (sortKey === "name") return { name: dirKey };
    if (sortKey === "category") return { category: { name: dirKey } };
    if (sortKey === "price") return { price: dirKey };
    if (sortKey === "stock") return { stock: dirKey };
    if (sortKey === "status") return { stock: dirKey };
    return { updatedAt: dirKey };
  })();

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy,
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const items = products.map((product) => {
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

  return NextResponse.json({ items, total });
}
