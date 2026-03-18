import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { searchParams } = new URL(request.url);
	const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
	const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "15") || 15));
	const query = (searchParams.get("q") ?? "").trim();
	const sort = (searchParams.get("sort") ?? "createdAt").trim();
	const dir = (searchParams.get("dir") ?? "desc").trim();
	const rawStatus = (searchParams.get("status") ?? "all").trim();

	const allowedSorts = new Set(["createdAt", "customerName", "status", "orderNumber", "totalAmount"]);
	const sortKey = (allowedSorts.has(sort) ? sort : "createdAt") as
		| "createdAt"
		| "customerName"
		| "status"
		| "orderNumber"
		| "totalAmount";
	const dirKey: Prisma.SortOrder = dir === "asc" ? "asc" : "desc";
	const allowedStatuses = new Set(["Pending", "Confirmed", "Shipped", "Delivered"]);
	const status = allowedStatuses.has(rawStatus) ? rawStatus : "all";

	const where = {
		...(status !== "all" ? { status } : {}),
		...(query
			? {
					OR: [
						{ orderNumber: { contains: query, mode: "insensitive" as const } },
						{ customerName: { contains: query, mode: "insensitive" as const } },
						{ phone: { contains: query, mode: "insensitive" as const } },
						{ status: { contains: query, mode: "insensitive" as const } },
						{ items: { some: { product: { name: { contains: query, mode: "insensitive" as const } } } } },
					],
				}
			: {}),
	};

	const orderBy: Prisma.OrderOrderByWithRelationInput =
		sortKey === "customerName"
			? { customerName: dirKey }
			: sortKey === "status"
			? { status: dirKey }
			: sortKey === "orderNumber"
			? { orderNumber: dirKey }
			: sortKey === "totalAmount"
			? { totalAmount: dirKey }
			: { createdAt: dirKey };

	const [orders, total] = await Promise.all([
		prisma.order.findMany({
			where,
			include: { items: { include: { product: true } } },
			orderBy,
			take: pageSize,
			skip: (page - 1) * pageSize,
		}),
		prisma.order.count({ where }),
	]);

	const items = orders.map((order) => ({
		id: order.id,
		orderNumber: order.orderNumber,
		customerName: order.customerName,
		phone: order.phone,
		status: order.status,
		totalAmount: order.totalAmount,
		orderItems: order.items.map((item) => ({
			id: item.id,
			productId: item.productId,
			productName: item.product.name,
			quantity: item.quantity,
			priceAtTime: item.priceAtTime,
		})),
		createdAt: order.createdAt.toISOString(),
	}));

	return NextResponse.json({ items, total });
}

export async function PATCH(request: Request) {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const { ids, status } = await request.json();
		if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
			return NextResponse.json({ error: "Missing ids or status" }, { status: 400 });
		}

		await prisma.order.updateMany({
			where: { id: { in: ids } },
			data: { status },
		});

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	try {
		const { ids } = await request.json();
		if (!ids || !Array.isArray(ids) || ids.length === 0) {
			return NextResponse.json({ error: "Missing ids" }, { status: 400 });
		}

		await prisma.order.deleteMany({
			where: { id: { in: ids } },
		});

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
