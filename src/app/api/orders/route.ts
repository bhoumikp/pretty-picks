import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

export async function GET() {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const orders = await prisma.order.findMany({
		include: { items: { include: { product: true } } },
		orderBy: { createdAt: "desc" },
	});
	return NextResponse.json(orders);
}

export async function POST(request: Request) {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json();
	const product = await prisma.product.findUnique({ where: { id: body.productId } });
	if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

	const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

	const order = await prisma.order.create({
		data: {
			orderNumber,
			customerName: body.customerName,
			phone: body.phone,
			status: body.status ?? "Pending",
			totalAmount: product.price,
			items: {
				create: [
					{
						productId: product.id,
						quantity: 1,
						priceAtTime: product.price,
					},
				],
			},
		},
	});

	await logAudit({
		actorId: session.user.id,
		action: "CREATE",
		entity: "ORDER",
		entityId: order.id,
		metadata: { status: order.status, orderNumber: order.orderNumber, productId: product.id },
		request,
	});

	return NextResponse.json(order, { status: 201 });
}
