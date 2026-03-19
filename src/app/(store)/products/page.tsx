import { prisma } from "@/lib/prisma";
import ProductsClient from "@/components/products-client";
import type { CategorySummary, ProductSummary } from "@/types/catalog";

export const revalidate = 60;
export const metadata = {
	title: "Products",
	description: "Browse Pretty Picks artificial jewellery collections.",
};

interface ProductsPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
	const resolvedParams = await searchParams;
	const query = typeof resolvedParams.q === "string" ? resolvedParams.q : "";
	const category = typeof resolvedParams.category === "string" ? resolvedParams.category : "";
	const priceCap = typeof resolvedParams.price === "string" ? Number(resolvedParams.price) : undefined;
	const sort = typeof resolvedParams.sort === "string" ? resolvedParams.sort : "";

	let products: ProductSummary[] = [];
	let categories: CategorySummary[] = [];

	try {
		[products, categories] = await Promise.all([
			prisma.product
				.findMany({
				where: { archivedAt: null, isActive: true },
				include: { category: true, _count: { select: { orderItems: true } } },
				orderBy: { createdAt: "desc" },
			})
				.then((items) =>
					items.map((item) => {
						const { _count, ...rest } = item;
						const isCategoryVisible =
							item.category &&
							item.category.isActive &&
							!item.category.archivedAt;
						return {
							...rest,
							category: isCategoryVisible ? item.category : null,
							orderCount: _count.orderItems,
						};
					})
				),
			prisma.category.findMany({ where: { archivedAt: null, isActive: true }, orderBy: { name: "asc" } }),
		]);
	} catch (error) {
		console.error("ProductsPage: Prisma unavailable, rendering empty lists.", error);
	}

	return (
		<div className="page-shell section-pad">
			<ProductsClient
				products={products}
				categories={categories}
				initialQuery={query}
				initialCategory={category}
				initialPriceCap={priceCap}
				initialSort={sort}
			/>
		</div>
	);
}
