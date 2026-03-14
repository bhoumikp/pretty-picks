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

  const allowedSorts = new Set(["createdAt", "name", "email"]);
  const sortKey = (allowedSorts.has(sort) ? sort : "createdAt") as
    | "createdAt"
    | "name"
    | "email";
  const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { message: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const orderBy: Prisma.ContactOrderByWithRelationInput =
    sortKey === "name"
      ? { name: dirKey }
      : sortKey === "email"
      ? { email: dirKey }
      : { createdAt: dirKey };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy,
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  const items = contacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    email: contact.email,
    message: contact.message,
    createdAt: contact.createdAt.toISOString(),
  }));

  return NextResponse.json({ items, total });
}
