import "../storefront.css";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import WhatsAppFab from "@/components/whatsapp-fab";
import { StorefrontSettingsProvider } from "@/components/storefront/storefront-settings-provider";
import { getResolvedWhatsAppNumber } from "@/lib/site-settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
	const [categories, settings] = await Promise.all([
		prisma.category.findMany({
			where: {
				isActive: true,
				parentId: null,
				archivedAt: null,
			},
			orderBy: {
				name: "asc",
			},
			select: {
				id: true,
				name: true,
				slug: true,
			},
		}),
		getSiteSettings(),
	]);

	return (
		<StorefrontSettingsProvider
			value={{
				whatsappNumber: getResolvedWhatsAppNumber(settings),
			}}
		>
			<div className="storefront flex min-h-screen flex-col">
				<Navbar
					categories={categories}
					branding={{
						storefrontLogoUrl: settings?.storefrontLogoUrl ?? null,
						storefrontMobileLogoUrl: settings?.storefrontMobileLogoUrl ?? null,
						storefrontLogoAlt: settings?.storefrontLogoAlt ?? null,
					}}
				/>
				<main className="flex-grow pt-16 md:pt-20">{children}</main>
				<Footer />
				<MobileBottomNav />
				<WhatsAppFab />
			</div>
		</StorefrontSettingsProvider>
	);
}
