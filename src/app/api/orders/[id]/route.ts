import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

interface Params {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      customerName: body.customerName,
      phone: body.phone,
      status: body.status,
    },
  });

  return NextResponse.json(order);
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.order.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
