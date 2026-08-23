import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_SETTINGS_ID } from "@/lib/site-settings";
import { headers } from "next/headers";

const DEACTIVATION_SECRET = process.env.LAUNCH_DEACTIVATION_SECRET || "pp-launch-deactivate-2026";

export async function POST() {
	try {
		// Security: Require a secret token to prevent unauthorized deactivation
		const headersList = await headers();
		const token = headersList.get("x-launch-token");
		if (token !== DEACTIVATION_SECRET) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const settings = await (prisma as any).siteSetting.findUnique({
			where: { id: SITE_SETTINGS_ID },
		});

		if (!settings || !settings.showCountdown || !settings.launchDate) {
			return NextResponse.json({ message: "No active countdown to deactivate" });
		}

		const now = new Date();
		const launchDate = new Date(settings.launchDate);

		// Security: Only allow deactivation if the launch date has actually passed
		if (now >= launchDate) {
			await (prisma as any).siteSetting.update({
				where: { id: SITE_SETTINGS_ID },
				data: { showCountdown: false },
			});
			return NextResponse.json({ success: true, message: "Countdown deactivated" });
		}

		return NextResponse.json(
			{ error: "Launch date has not been reached yet" },
			{ status: 400 }
		);
	} catch (error) {
		console.error("Launch deactivation error:", error);
		return NextResponse.json(
			{ error: "Failed to deactivate countdown" },
			{ status: 500 }
		);
	}
}
