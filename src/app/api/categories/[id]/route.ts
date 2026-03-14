import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const categoryId = resolvedParams?.id;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const data: {
    name?: string;
    slug?: string;
    image?: string | null;
    parentId?: string | null;
    active?: boolean;
  } = {};

  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
    data.slug = slugify(body.name);
  }

  if ("image" in body) {
    data.image = body.image ? String(body.image) : null;
  }

  if ("parentId" in body) {
    data.parentId = body.parentId ? String(body.parentId) : null;
  }

  if (typeof body.active === "boolean") {
    data.active = body.active;
  }

  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error("Category update failed:", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const categoryId = resolvedParams?.id;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.category.delete({ where: { id: categoryId } });
  return NextResponse.json({ ok: true });
}
