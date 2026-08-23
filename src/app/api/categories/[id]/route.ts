import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export async function PATCH(
	request: Request,
	{ params }: { params: { id: string } | Promise<{ id: string }> }
) {
	const resolvedParams = await Promise.resolve(params);
	const categoryId = resolvedParams?.id;
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json();

	const existing = await prisma.category.findUnique({ where: { id: categoryId } });
	if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

	const data: {
		name?: string;
		slug?: string;
		image?: string | null;
		parentId?: string | null;
		isActive?: boolean;
		archivedAt?: Date | null;
	} = {};

	if (typeof body.name === "string" && body.name.trim()) {
		data.name = body.name.trim();
		data.slug = slugify(body.name);
	}

	if ("image" in body) {
		data.image = body.image ? String(body.image) : null;
	}

	if ("parentId" in body) {
		data.parentId = body.parentId ? String(body.parentId) : null;
	}

	if (typeof body.isActive === "boolean") {
		data.isActive = body.isActive;
	}
	if ("archivedAt" in body) {
		data.archivedAt = body.archivedAt ? new Date(body.archivedAt) : null;
	}

	const changedKeys = Object.keys(data).filter((key) => {
		const nextValue = data[key as keyof typeof data];
		if (nextValue === undefined) return false;
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

	try {
		const category = await prisma.category.update({
			where: { id: categoryId },
			data,
		});
		await logAudit({
			actorId: session.user.id,
			action: "UPDATE",
			entity: "CATEGORY",
			entityId: category.id,
			metadata: { updatedFields: changedKeys },
			request,
		});
		return NextResponse.json(category);
	} catch (error) {
		console.error("Category update failed:", error);
		return NextResponse.json({ error: "Update failed." }, { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } | Promise<{ id: string }> }
) {
	const resolvedParams = await Promise.resolve(params);
	const categoryId = resolvedParams?.id;
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const [childCount, productCount] = await Promise.all([
		prisma.category.count({ where: { parentId: categoryId } }),
		prisma.product.count({ where: { categoryId } }),
	]);
	if (childCount > 0 || productCount > 0) {
		return NextResponse.json(
			{ error: "Cannot delete category while it has subcategories or products.", childCount, productCount },
			{ status: 409 }
		);
	}

	await prisma.category.update({
		where: { id: categoryId },
		data: { archivedAt: new Date() },
	});

	await logAudit({
		actorId: session.user.id,
		action: "DELETE",
		entity: "CATEGORY",
		entityId: categoryId,
		request,
	});
	return NextResponse.json({ ok: true });
}
