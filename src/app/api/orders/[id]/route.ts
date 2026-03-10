import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

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

  return NextResponse.json(order);
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
