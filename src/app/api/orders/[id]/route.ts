import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await request.json();
  const order = await prisma.order.update({
    where: { id },
    data: {
      customerName: body.customerName,
      phone: body.phone,
      status: body.status,
    },
  });

  await logAudit({
    actorId: session.user.id,
    action: "UPDATE",
    entity: "ORDER",
    entityId: order.id,
    metadata: { status: order.status },
    request,
  });

  return NextResponse.json(order);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.order.delete({ where: { id } });
  await logAudit({
    actorId: session.user.id,
    action: "DELETE",
    entity: "ORDER",
    entityId: id,
    request,
  });
  return NextResponse.json({ ok: true });
}
