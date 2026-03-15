import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

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
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if ("archivedAt" in body) data.archivedAt = body.archivedAt ? new Date(body.archivedAt) : null;

  const product = await prisma.product.update({
    where: { id },
    data,
  });

  await logAudit({
    actorId: session.user.id,
    action: "UPDATE",
    entity: "PRODUCT",
    entityId: product.id,
    metadata: { updatedFields: Object.keys(data) },
    request,
  });

  return NextResponse.json(product);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.product.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  await logAudit({
    actorId: session.user.id,
    action: "DELETE",
    entity: "PRODUCT",
    entityId: id,
    request: request,
  });
  return NextResponse.json({ ok: true });
}
