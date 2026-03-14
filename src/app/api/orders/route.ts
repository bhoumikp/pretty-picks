import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const order = await prisma.order.create({
    data: {
      productId: body.productId,
      customerName: body.customerName,
      phone: body.phone,
      status: body.status ?? "Pending",
    },
  });

  await logAudit({
    actorId: session.user.id,
    action: "CREATE",
    entity: "ORDER",
    entityId: order.id,
    metadata: { status: order.status, productId: order.productId },
    request,
  });

  return NextResponse.json(order, { status: 201 });
}
