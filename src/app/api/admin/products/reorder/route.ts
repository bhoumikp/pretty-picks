import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

export async function PUT(req: Request) {
	try {
		const session = await requireAdmin();
		if (!session) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const body = await req.json();
		const { orders } = body; // Array of { id: string, priority: number }

		if (!Array.isArray(orders)) {
			return new NextResponse("Invalid request body", { status: 400 });
		}

		await prisma.$transaction(
			orders.map((item: { id: string; priority: number }) =>
				prisma.product.update({
					where: { id: item.id },
					data: { priority: item.priority },
				})
			)
		);

		await logAudit({
			actorId: session.user.id,
			action: "UPDATE",
			entity: "PRODUCT",
			entityId: "bulk",
			metadata: { type: "REORDER", count: orders.length },
			request: req,
		});

		return new NextResponse("OK", { status: 200 });
	} catch (error) {
		console.error("[PRODUCTS_REORDER]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
