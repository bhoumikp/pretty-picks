import { notFound } from "next/navigation";
import AdminBannerForm from "@/components/admin/admin-banner-form";
import { prisma } from "@/lib/prisma";

export const metadata = {
	title: { absolute: "Admin | Edit Banner" },
};

export default async function AdminBannerEditPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const banner = await prisma.heroBanner.findUnique({
		where: { id },
	});

	if (!banner) notFound();

	return (
		<AdminBannerForm
			mode="edit"
			initialValues={{
				id: banner.id,
				eyebrow: banner.eyebrow ?? "",
				title: banner.title,
				subtitle: banner.subtitle ?? "",
				image: banner.image,
				mobileImage: banner.mobileImage ?? "",
				link: banner.link ?? "",
				ctaLabel: banner.ctaLabel ?? "",
				priority: String(banner.priority),
			}}
		/>
	);
}
