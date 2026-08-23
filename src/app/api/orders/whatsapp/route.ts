import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface WhatsAppOrderItem {
	productId: string;
	quantity: number;
}

interface WhatsAppOrderBody {
	items: WhatsAppOrderItem[];
	source?: "product" | "cart";
}

/**
 * Public endpoint — no auth required.
 * Records a WhatsApp order intent whenever the user clicks "Order on WhatsApp".
 * Orders are created with status "WhatsApp Intent" so the store owner can see
 * all interest and then promote to "Confirmed" after the WhatsApp conversation.
 */
export async function POST(request: Request) {
	try {
		const body = (await request.json()) as WhatsAppOrderBody;

		if (!Array.isArray(body.items) || body.items.length === 0) {
			return NextResponse.json({ error: "No items provided" }, { status: 400 });
		}

		// Security: Prevent spam with item and quantity limits
		if (body.items.length > 20) {
			return NextResponse.json({ error: "Too many items" }, { status: 400 });
		}
		for (const item of body.items) {
			if (!item.productId || typeof item.quantity !== "number" || item.quantity < 1 || item.quantity > 100) {
				return NextResponse.json({ error: "Invalid item data" }, { status: 400 });
			}
		}

		// Securely fetch live prices from the database
		const products = await prisma.product.findMany({
			where: { id: { in: body.items.map((i) => i.productId) } },
		});
		
		const productMap = new Map(products.map((p) => [p.id, p]));
		let totalAmount = 0;

		const orderItemsData = body.items.map((item) => {
			const product = productMap.get(item.productId);
			if (!product) throw new Error(`Product ${item.productId} not found`);
			const priceAtTime = product.price;
			totalAmount += priceAtTime * item.quantity;
			return {
				productId: item.productId,
				quantity: item.quantity,
				priceAtTime,
			};
		});

		const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

		const order = await prisma.order.create({
			data: {
				orderNumber,
				customerName: "WhatsApp Order",
				phone: "-",
				status: "WhatsApp Intent",
				totalAmount,
				items: {
					create: orderItemsData,
				},
			},
		});

		return NextResponse.json({ ok: true, orderId: order.id, orderNumber });
	} catch (error) {
		console.error("Failed to record order intent:", error);
		return NextResponse.json({ error: "Failed to record order" }, { status: 500 });
	}
}
