import { prisma } from "@/lib/prisma";
import OfflineBanner from "@/components/admin/offline-banner";
import AdminMediaClient from "@/components/admin/admin-media-client";

export const revalidate = 0;
export const metadata = {
	title: { absolute: "Admin | Media" },
};

export default async function AdminMediaPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string; q?: string; pageSize?: string }>;
}) {
	const params = await searchParams;
	const page = Math.max(1, Number(params?.page ?? "1") || 1);
	const pageSize = Math.min(48, Math.max(1, Number(params?.pageSize ?? "24") || 24));
	const query = (params?.q ?? "").trim();

	let items: Array<Awaited<ReturnType<typeof prisma.media.findMany>>[number]> = [];
	let total = 0;
	let dbUnavailable = false;

	try {
		const where = query
			? {
					OR: [
						{ publicId: { contains: query, mode: "insensitive" as const } },
						{ url: { contains: query, mode: "insensitive" as const } },
						{ alt: { contains: query, mode: "insensitive" as const } },
					],
				}
			: undefined;
		const whereClause = where ?? undefined;
		const [mediaResult, totalResult] = await Promise.all([
			prisma.media.findMany({
				where: whereClause,
				orderBy: { createdAt: "desc" },
				take: pageSize,
				skip: (page - 1) * pageSize,
			}),
			prisma.media.count({ where: whereClause }),
		]);
		items = mediaResult;
		total = totalResult;
	} catch (error) {
		console.error("Admin media DB error:", error);
		dbUnavailable = true;
	}

	const serialized = items.map((item) => ({
		id: item.id,
		url: item.url,
		publicId: item.publicId,
		format: item.format,
		width: item.width,
		height: item.height,
		bytes: item.bytes,
		alt: item.alt,
		createdAt: item.createdAt.toISOString(),
	}));

	return (
		<div className="grid gap-4">
			{dbUnavailable && <OfflineBanner />}
			<AdminMediaClient
				initialItems={serialized}
				initialTotal={total}
				initialPage={page}
				pageSize={pageSize}
				initialQuery={query}
			/>
		</div>
	);
}
