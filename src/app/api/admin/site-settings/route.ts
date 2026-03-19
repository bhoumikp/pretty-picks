import { NextResponse } from "next/server";
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
		launchDate?: string | null;
		showCountdown?: boolean;
	};

	const nextLogoUrl = body.storefrontLogoUrl?.trim() || null;
	const nextMobileLogoUrl = body.storefrontMobileLogoUrl?.trim() || null;
	const nextLogoAlt = body.storefrontLogoAlt?.trim() || null;
	const nextLaunchDate = body.launchDate ? new Date(body.launchDate) : null;
	const nextShowCountdown = body.showCountdown ?? false;

	const existing = await prisma.siteSetting.findUnique({
		where: { id: SITE_SETTINGS_ID },
	});

	const changed =
		(existing?.storefrontLogoUrl ?? null) !== nextLogoUrl ||
		(existing?.storefrontMobileLogoUrl ?? null) !== nextMobileLogoUrl ||
		(existing?.storefrontLogoAlt ?? null) !== nextLogoAlt ||
		(existing?.launchDate?.toISOString() ?? null) !== (nextLaunchDate?.toISOString() ?? null) ||
		(existing?.showCountdown ?? false) !== nextShowCountdown;

	const settings = await prisma.siteSetting.upsert({
		where: { id: SITE_SETTINGS_ID },
		update: {
			storefrontLogoUrl: nextLogoUrl,
			storefrontMobileLogoUrl: nextMobileLogoUrl,
			storefrontLogoAlt: nextLogoAlt,
			launchDate: nextLaunchDate,
			showCountdown: nextShowCountdown,
		},
		create: {
			id: SITE_SETTINGS_ID,
			storefrontLogoUrl: nextLogoUrl,
			storefrontMobileLogoUrl: nextMobileLogoUrl,
			storefrontLogoAlt: nextLogoAlt,
			launchDate: nextLaunchDate,
			showCountdown: nextShowCountdown,
		},
	});

	if (changed) {
		await logAudit({
			actorId: session.user.id,
			action: "UPDATE",
			entity: "SITE_SETTINGS",
			entityId: settings.id,
			metadata: {
				storefrontLogoUrl: nextLogoUrl,
				storefrontMobileLogoUrl: nextMobileLogoUrl,
				storefrontLogoAlt: nextLogoAlt,
				launchDate: nextLaunchDate,
				showCountdown: nextShowCountdown,
			},
			request,
		});
	}

	return NextResponse.json({
		storefrontLogoUrl: settings.storefrontLogoUrl,
		storefrontMobileLogoUrl: settings.storefrontMobileLogoUrl,
		storefrontLogoAlt: settings.storefrontLogoAlt,
		launchDate: settings.launchDate,
		showCountdown: settings.showCountdown,
	});
}
