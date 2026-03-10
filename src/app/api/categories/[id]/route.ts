import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";

interface Params {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {
    ...body,
  };
  if (body.name) data.slug = slugify(body.name);

  const category = await prisma.category.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(category);
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
