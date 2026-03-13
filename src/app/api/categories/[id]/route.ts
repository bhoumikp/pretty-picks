import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await request.json();
  const data: Record<string, unknown> = {
    ...body,
  };
  if (body.name) data.slug = slugify(body.name);
  if (body.parentId === "") data.parentId = null;

  const category = await prisma.category.update({
    where: { id },
    data,
  });

  return NextResponse.json(category);
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
