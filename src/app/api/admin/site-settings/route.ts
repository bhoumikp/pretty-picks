import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { SITE_SETTINGS_ID } from "@/lib/site-settings";

export async function PATCH(request: Request) {
	const session = await requireAdmin();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = (await request.json()) as {
		storefrontLogoUrl?: string | null;
		storefrontMobileLogoUrl?: string | null;
		storefrontLogoAlt?: string | null;
		whatsappNumber?: string | null;
		launchDate?: string | null;
		showCountdown?: boolean;
	};

	// Only build update payload for fields explicitly sent
	const updateData: Record<string, unknown> = {};

	if ("storefrontLogoUrl" in body) updateData.storefrontLogoUrl = body.storefrontLogoUrl?.trim() || null;
	if ("storefrontMobileLogoUrl" in body) updateData.storefrontMobileLogoUrl = body.storefrontMobileLogoUrl?.trim() || null;
	if ("storefrontLogoAlt" in body) updateData.storefrontLogoAlt = body.storefrontLogoAlt?.trim() || null;
	if ("whatsappNumber" in body) updateData.whatsappNumber = body.whatsappNumber?.trim() || null;
	if ("launchDate" in body) updateData.launchDate = body.launchDate ? new Date(body.launchDate) : null;
	if ("showCountdown" in body) updateData.showCountdown = body.showCountdown ?? false;

	const existing = await prisma.siteSetting.findUnique({
		where: { id: SITE_SETTINGS_ID },
	});

	const settings = await prisma.siteSetting.upsert({
		where: { id: SITE_SETTINGS_ID },
		update: updateData,
		create: {
			id: SITE_SETTINGS_ID,
			storefrontLogoUrl: (updateData.storefrontLogoUrl as string) ?? null,
			storefrontMobileLogoUrl: (updateData.storefrontMobileLogoUrl as string) ?? null,
			storefrontLogoAlt: (updateData.storefrontLogoAlt as string) ?? null,
			whatsappNumber: (updateData.whatsappNumber as string) ?? null,
			launchDate: (updateData.launchDate as Date) ?? null,
			showCountdown: (updateData.showCountdown as boolean) ?? false,
		},
	});

	// Check if anything actually changed
	const changed = existing
		? Object.keys(updateData).some((key) => {
				const oldVal = (existing as Record<string, unknown>)[key];
				const newVal = updateData[key];
				if (oldVal instanceof Date && newVal instanceof Date) return oldVal.toISOString() !== newVal.toISOString();
				return oldVal !== newVal;
			})
		: true;

	if (changed) {
		const auditMetadata: Prisma.InputJsonObject = Object.fromEntries(
			Object.entries(updateData).map(([key, value]) => [
				key,
				value instanceof Date ? value.toISOString() : value === undefined ? null : value,
			])
		);

		await logAudit({
			actorId: session.user.id,
			action: "UPDATE",
			entity: "SITE_SETTINGS",
			entityId: settings.id,
			metadata: auditMetadata,
			request,
		});
	}

	return NextResponse.json({
		storefrontLogoUrl: settings.storefrontLogoUrl,
		storefrontMobileLogoUrl: settings.storefrontMobileLogoUrl,
		storefrontLogoAlt: settings.storefrontLogoAlt,
		whatsappNumber: settings.whatsappNumber,
		launchDate: settings.launchDate,
		showCountdown: settings.showCountdown,
	});
}
