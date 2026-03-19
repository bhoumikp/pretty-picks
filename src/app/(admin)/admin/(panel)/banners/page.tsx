import { prisma } from "@/lib/prisma";
import AdminBanners from "@/components/admin/admin-banners";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const metadata = {
	title: { absolute: "Admin | Banners" },
};

export default async function AdminBannersPage() {
	let banners: Array<{
		id: string;
		eyebrow: string | null;
		title: string;
		subtitle: string | null;
		image: string;
		mobileImage: string | null;
		link: string | null;
		ctaLabel: string | null;
		priority: number;
		isActive: boolean;
		createdAt: Date;
		updatedAt: Date;
	}> = [];
	let dbUnavailable = false;

	try {
		banners = await prisma.heroBanner.findMany({
			orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
		});
	} catch (error) {
		console.error("Admin banners DB error:", error);
		dbUnavailable = true;
	}

	const mapped = banners.map((banner) => ({
		...banner,
		createdAt: banner.createdAt.toISOString(),
		updatedAt: banner.updatedAt.toISOString(),
	}));

	return (
		<div className="grid gap-4">
			{dbUnavailable && <OfflineBanner />}
			<AdminBanners initialBanners={mapped} />
		</div>
	);
}
