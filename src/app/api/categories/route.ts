import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";
import { logAudit } from "@/lib/audit";

export async function GET() {
	const categories = await prisma.category.findMany({
		where: { archivedAt: null },
		orderBy: { name: "asc" },
	});
	return NextResponse.json(categories);
}

export async function POST(request: Request) {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json();
	const category = await prisma.category.create({
		data: {
			name: body.name,
			slug: slugify(body.name),
			image: body.image ?? null,
			parentId: body.parentId ?? null,
		},
	});

	await logAudit({
		actorId: session.user.id,
		action: "CREATE",
		entity: "CATEGORY",
		entityId: category.id,
		metadata: { name: category.name, parentId: category.parentId },
		request,
	});

	return NextResponse.json(category, { status: 201 });
}
