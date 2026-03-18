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
	const existing = await prisma.product.findUnique({ where: { id } });
	if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

	const data: Record<string, unknown> = { ...body };

	if (body.name) data.slug = slugify(body.name);
	if (body.price) data.price = Number(body.price);
	if (body.stock !== undefined) data.stock = Number(body.stock);
	if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
	if ("archivedAt" in body) data.archivedAt = body.archivedAt ? new Date(body.archivedAt) : null;

	const changedKeys = Object.keys(data).filter((key) => {
		const nextValue = data[key];
		if (nextValue === undefined) return false;
		if (key === "price" || key === "stock") {
			return Number(existing[key as "price" | "stock"]) !== Number(nextValue);
		}
		if (key === "images") {
			return JSON.stringify(existing.images) !== JSON.stringify(nextValue);
		}
		if (key === "archivedAt") {
			const existingValue = existing.archivedAt?.toISOString() ?? null;
			const nextDate = nextValue instanceof Date ? nextValue.toISOString() : nextValue ?? null;
			return existingValue !== nextDate;
		}
		return (existing as Record<string, unknown>)[key] !== nextValue;
	});

	if (changedKeys.length === 0) {
		return NextResponse.json(existing);
	}

	const product = await prisma.product.update({
		where: { id },
		data,
	});

	await logAudit({
		actorId: session.user.id,
		action: "UPDATE",
		entity: "PRODUCT",
		entityId: product.id,
		metadata: { updatedFields: changedKeys },
		request,
	});

	return NextResponse.json(product);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const { id } = await params;

	const orderCount = await prisma.orderItem.count({ where: { productId: id } });
	if (orderCount > 0) {
		return NextResponse.json(
			{ error: "Cannot delete product while orders exist.", orderCount },
			{ status: 409 }
		);
	}

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
