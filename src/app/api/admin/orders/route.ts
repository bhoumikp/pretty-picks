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
  const sort = (searchParams.get("sort") ?? "createdAt").trim();
  const dir = (searchParams.get("dir") ?? "desc").trim();

  const allowedSorts = new Set(["createdAt", "customerName", "status", "product"]);
  const sortKey = (allowedSorts.has(sort) ? sort : "createdAt") as
    | "createdAt"
    | "customerName"
    | "status"
    | "product";
  const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";

  const where = query
    ? {
        OR: [
          { customerName: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query, mode: "insensitive" as const } },
          { status: { contains: query, mode: "insensitive" as const } },
          { product: { name: { contains: query, mode: "insensitive" as const } } },
        ],
      }
    : undefined;

  const orderBy: Prisma.OrderOrderByWithRelationInput =
    sortKey === "customerName"
      ? { customerName: dirKey }
      : sortKey === "status"
      ? { status: dirKey }
      : sortKey === "product"
      ? { product: { name: dirKey } }
      : { createdAt: dirKey };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { product: true },
      orderBy,
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  const items = orders.map((order) => ({
    id: order.id,
    customerName: order.customerName,
    phone: order.phone,
    status: order.status,
    productName: order.product?.name ?? null,
    createdAt: order.createdAt.toISOString(),
  }));

  return NextResponse.json({ items, total });
}
