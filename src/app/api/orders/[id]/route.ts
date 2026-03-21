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
	const existing = await prisma.order.findUnique({ where: { id } });
	if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

	const data = {
		customerName: body.customerName,
		phone: body.phone,
		status: body.status,
	};

	const changedKeys = Object.keys(data).filter((key) => {
		const nextValue = (data as Record<string, unknown>)[key];
		if (nextValue === undefined) return false;
		return (existing as Record<string, unknown>)[key] !== nextValue;
	});
	if (changedKeys.length === 0) {
		return NextResponse.json(existing);
	}

	const order = await prisma.order.update({
		where: { id },
		data,
	});

	await logAudit({
		actorId: session.user.id,
		action: "UPDATE",
		entity: "ORDER",
		entityId: order.id,
		metadata: { updatedFields: changedKeys, status: order.status },
		request,
	});

	return NextResponse.json(order);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const { id } = await params;

	await prisma.order.update({
		where: { id },
		data: { archivedAt: new Date() },
	});
	await logAudit({
		actorId: session.user.id,
		action: "DELETE",
		entity: "ORDER",
		entityId: id,
		request,
	});
	return NextResponse.json({ ok: true });
}
