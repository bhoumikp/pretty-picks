import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/product-grid";
import ProductCard from "@/components/product-card";
import type { CategorySummary, ProductSummary } from "@/types/catalog";

export const revalidate = 60;
export const metadata = {
	title: "Categories",
	description: "Browse Pretty Picks categories.",
};

interface CategoriesPageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
	const resolvedParams = await searchParams;
	const selectedSlug = typeof resolvedParams.category === "string" ? resolvedParams.category : "";
	let categories: CategorySummary[] = [];
	let selectedProducts: ProductSummary[] = [];
	let selectedCategoryName = "Categories";

	try {
		categories = await prisma.category.findMany({
			where: { archivedAt: null, isActive: true },
			orderBy: { name: "asc" },
			select: { id: true, name: true, slug: true, image: true },
		});
		const fallbackSlug = selectedSlug || categories[0]?.slug;
		if (fallbackSlug) {
			const selectedCategory = await prisma.category.findFirst({
				where: { slug: fallbackSlug, archivedAt: null, isActive: true },
				select: { name: true },
			});
			selectedCategoryName = selectedCategory?.name ?? selectedCategoryName;
			selectedProducts = await prisma.product.findMany({
				where: { category: { slug: fallbackSlug }, archivedAt: null, isActive: true },
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					slug: true,
					price: true,
					material: true,
					stock: true,
					images: true,
					category: {
						select: { id: true, name: true, slug: true, image: true },
					},
				},
			});
		}
	} catch (error) {
		console.error("CategoriesPage: Prisma unavailable, rendering empty list.", error);
	}

	return (
		<div className="page-shell section-pad pb-24 md:pb-10">
			<div className="mb-6">
				<p className="eyebrow">Categories</p>
				<h1 className="section-title">Shop by vibe</h1>
				<p className="mt-2 text-sm text-[var(--pp-muted)]">
					Quick picks styled like your favorite quick-commerce apps.
				</p>
			</div>

			{categories.length === 0 ? (
				<div className="rounded-3xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
					No categories available right now.
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-[220px_1fr]">
					<aside className="rounded-2xl border border-[var(--pp-border)] bg-white/90 p-3 shadow-sm md:sticky md:top-24">
						<div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
							{categories.map((category) => {
								const isActive = category.slug === (selectedSlug || categories[0]?.slug);
								return (
									<Link
										key={category.id}
										href={`/categories?category=${category.slug}`}
										className={`group flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-all ${
											isActive
												? "border-[var(--pp-gold)] bg-[var(--pp-beige)] text-[var(--pp-ink)]"
												: "border-transparent bg-white hover:border-[var(--pp-border)] hover:bg-[var(--pp-beige)]/50"
										}`}
									>
										<span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--pp-beige)]">
											<Image
												src={category.image ?? "/images/placeholder.svg"}
												alt={category.name}
												fill
												sizes="36px"
												className="object-cover"
											/>
										</span>
										<span className="min-w-0 truncate font-medium">{category.name}</span>
									</Link>
								);
							})}
						</div>
					</aside>
					<section>
						<div className="mb-4 flex items-end justify-between">
							<div>
								<p className="eyebrow">Category</p>
								<h2 className="section-title">{selectedCategoryName}</h2>
							</div>
						</div>
						{selectedProducts.length === 0 ? (
							<div className="rounded-3xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
								No products found in this category yet. Check back soon.
							</div>
						) : (
							<>
								<div className="grid grid-cols-2 gap-3 md:hidden">
									{selectedProducts.map((product) => (
										<ProductCard key={product.id} product={product} />
									))}
								</div>
								<div className="hidden md:block">
									<ProductGrid products={selectedProducts} />
								</div>
							</>
						)}
					</section>
				</div>
			)}
		</div>
	);
}
