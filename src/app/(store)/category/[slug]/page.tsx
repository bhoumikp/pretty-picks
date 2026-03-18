import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/product-grid";
import Breadcrumbs from "@/components/breadcrumbs";

interface CategoryPageProps {
	params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: CategoryPageProps) {
	const resolvedParams = await params;
	const category = await prisma.category.findUnique({
		where: { slug: resolvedParams.slug },
		select: { name: true },
	});

	return {
		title: category ? `${category.name} Collection` : "Category",
	};
}

export default async function CategoryPage({ params }: CategoryPageProps) {
	const resolvedParams = await params;
	let category = null;
	let dbUnavailable = false;

	try {
		category = await prisma.category.findFirst({
			where: { slug: resolvedParams.slug, archivedAt: null, isActive: true },
			include: {
				products: {
					where: { archivedAt: null, isActive: true },
					include: { category: true },
				},
			},
		});
	} catch (error) {
		dbUnavailable = true;
		console.error("CategoryPage: Prisma unavailable, rendering empty state.", error);
	}

	if (!category && !dbUnavailable) return notFound();
	if (!category && dbUnavailable) {
		return (
			<div className="page-shell section-pad">
				<div className="flex items-end justify-between">
					<div>
						<Breadcrumbs
							items={[
								{ label: "Home", href: "/" },
								{ label: "Shop", href: "/products" },
								{ label: resolvedParams.slug },
							]}
						/>
						<p className="eyebrow">Category</p>
						<h1 className="section-title">{resolvedParams.slug}</h1>
						<p className="mt-2 text-sm text-[var(--pp-muted)]">0 pieces available</p>
					</div>
					<Link href="/products" className="text-sm text-[var(--pp-gold)]">
						Back to products
					</Link>
				</div>
				<div className="mt-8 rounded-3xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
					Database unavailable. Please try again in a moment.
				</div>
			</div>
		);
	}
	if (!category) return notFound();

	return (
		<div className="page-shell section-pad">
			<div className="flex items-end justify-between">
				<div>
					<Breadcrumbs
						items={[
							{ label: "Home", href: "/" },
							{ label: "Shop", href: "/products" },
							{ label: category.name },
						]}
					/>
					<p className="eyebrow">Category</p>
					<h1 className="section-title">{category.name}</h1>
					<p className="mt-2 text-sm text-[var(--pp-muted)]">
						{category.products.length} pieces available
					</p>
				</div>
				<Link href="/products" className="text-sm text-[var(--pp-gold)]">
					Back to products
				</Link>
			</div>
			<div className="mt-8">
				{category.products.length === 0 ? (
					<div className="rounded-3xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
						No products found in this category yet. Check back soon.
					</div>
				) : (
					<ProductGrid products={category.products} />
				)}
			</div>
		</div>
	);
}
