import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";

const MAX_TAKE = 48;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const material = searchParams.get("material")?.trim();
  const featuredOnly = searchParams.get("featured") === "true";
  const minPrice = Number(searchParams.get("minPrice"));
  const maxPrice = Number(searchParams.get("maxPrice"));
  const sort = searchParams.get("sort") ?? "newest";
  const take = Math.min(Number(searchParams.get("take")) || 12, MAX_TAKE);
  const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

  const filters: Prisma.ProductWhereInput[] = [];

  if (query) {
    filters.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { category: { name: { contains: query, mode: "insensitive" } } },
      ],
    });
  }

  if (category) {
    filters.push({ category: { slug: category } });
  }

  if (material) {
    filters.push({ material: { contains: material, mode: "insensitive" } });
  }

  if (featuredOnly) {
    filters.push({ featured: true });
  }

  if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
    filters.push({
      price: {
        gte: Number.isNaN(minPrice) ? undefined : minPrice,
        lte: Number.isNaN(maxPrice) ? undefined : maxPrice,
      },
    });
  }

  const where: Prisma.ProductWhereInput = filters.length ? { AND: filters } : {};

  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
  switch (sort) {
    case "price-low":
      orderBy = { price: "asc" };
      break;
    case "price-high":
      orderBy = { price: "desc" };
      break;
    case "popular":
      orderBy = [{ featured: "desc" }, { createdAt: "desc" }];
      break;
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy,
      take,
      skip,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        material: true,
        featured: true,
        stock: true,
        images: true,
        category: {
          select: { id: true, name: true, slug: true, image: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ items, total, skip, take });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug: slugify(body.name),
      price: Number(body.price),
      description: body.description,
      material: body.material,
      images: body.images ?? [],
      featured: Boolean(body.featured),
      stock: Number(body.stock ?? 0),
      categoryId: body.categoryId,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
