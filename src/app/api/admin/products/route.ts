import { NextResponse } from "next/server";
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

  const orderBy = sortKeys.map((key, index) => {
    const direction = dirKeys[index] ?? "desc";
    if (key === "name") return { name: direction };
    if (key === "category") return { category: { name: direction } };
    if (key === "price") return { price: direction };
    if (key === "stock") return { stock: direction };
    if (key === "status") return { stock: direction };
    return { updatedAt: direction };
  });

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
