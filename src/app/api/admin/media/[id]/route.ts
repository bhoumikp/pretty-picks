import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const media = await prisma.media.findUnique({ where: { id } });
	if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

	await prisma.media.update({
		where: { id },
		data: { archivedAt: new Date() },
	});

	await logAudit({
		actorId: session.user.id,
		action: "DELETE",
		entity: "MEDIA",
		entityId: id,
		metadata: { publicId: media.publicId ?? null },
	});

	return NextResponse.json({ ok: true });
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await requireAdmin();
	if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const body = (await request.json().catch(() => null)) as { alt?: string } | null;
	const nextAlt = typeof body?.alt === "string" ? body.alt.trim() : "";
	if (!nextAlt) {
		return NextResponse.json({ error: "Name is required." }, { status: 400 });
	}

	const existing = await prisma.media.findUnique({ where: { id } });
	if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
	if ((existing.alt ?? "") === nextAlt) {
		return NextResponse.json({
			id: existing.id,
			url: existing.url,
			publicId: existing.publicId,
			format: existing.format,
			width: existing.width,
			height: existing.height,
			bytes: existing.bytes,
			alt: existing.alt,
			createdAt: existing.createdAt.toISOString(),
		});
	}

	const media = await prisma.media.update({
		where: { id },
		data: { alt: nextAlt },
	});

	await logAudit({
		actorId: session.user.id,
		action: "UPDATE",
		entity: "MEDIA",
		entityId: id,
		metadata: { updatedFields: ["alt"], alt: nextAlt },
	});

	return NextResponse.json({
		id: media.id,
		url: media.url,
		publicId: media.publicId,
		format: media.format,
		width: media.width,
		height: media.height,
		bytes: media.bytes,
		alt: media.alt,
		createdAt: media.createdAt.toISOString(),
	});
}
