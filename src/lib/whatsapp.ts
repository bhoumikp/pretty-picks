import { siteConfig } from "@/data/site";

export const buildWhatsAppLink = (message: string) => {
	const text = encodeURIComponent(message);
	return `https://wa.me/${siteConfig.whatsappNumber}?text=${text}`;
};

/**
 * Detect whether the current device is mobile/touch-based.
 */
function isMobileDevice(): boolean {
	if (typeof navigator === "undefined") return false;
	return navigator.maxTouchPoints > 0;
}

/**
 * Opens WhatsApp with the given message.
 * On mobile: uses location.href for direct app launch (no blank tab).
 * On desktop: opens a new tab (WhatsApp Web).
 */
export function openWhatsApp(message: string): void {
	const link = buildWhatsAppLink(message);
	if (isMobileDevice()) {
		window.location.href = link;
	} else {
		window.open(link, "_blank", "noopener,noreferrer");
	}
}
