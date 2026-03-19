import AdminSettings from "@/components/admin/admin-settings";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata = {
	title: { absolute: "Admin | Settings" },
};

export default async function AdminSettingsPage() {
	const settings = await getSiteSettings();

	return (
		<AdminSettings
			initialBranding={{
				storefrontLogoUrl: settings?.storefrontLogoUrl ?? "",
				storefrontMobileLogoUrl: settings?.storefrontMobileLogoUrl ?? "",
				storefrontLogoAlt: settings?.storefrontLogoAlt ?? "",
				whatsappNumber: settings?.whatsappNumber ?? "",
			}}
			initialSettings={{
				launchDate: settings?.launchDate?.toISOString() ?? null,
				showCountdown: settings?.showCountdown ?? false,
			}}
		/>
	);
}
