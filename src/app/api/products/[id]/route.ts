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
  if (body.price) data.price = Number(body.price);
  if (body.stock !== undefined) data.stock = Number(body.stock);
  if (body.featured !== undefined) data.featured = Boolean(body.featured);

  const product = await prisma.product.update({
    where: { id },
    data,
  });

  return NextResponse.json(product);
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
