import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/data/site";

export const SITE_SETTINGS_ID = "singleton";

export interface SiteSettings {
	id: string;
	storefrontLogoUrl: string | null;
	storefrontMobileLogoUrl: string | null;
	storefrontLogoAlt: string | null;
	whatsappNumber: string | null;
	launchDate: Date | null;
	showCountdown: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
	try {
		return (await prisma.siteSetting.findUnique({
			where: { id: SITE_SETTINGS_ID },
		})) as SiteSettings | null;
	} catch (error) {
		console.error("Site settings fetch failed:", error);
		return null;
	}
}

export function getResolvedWhatsAppNumber(settings?: Pick<SiteSettings, "whatsappNumber"> | null) {
	return settings?.whatsappNumber?.trim() || siteConfig.whatsappNumber;
}
