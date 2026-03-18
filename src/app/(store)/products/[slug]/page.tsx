import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import ProductGrid from "@/components/product-grid";
import Breadcrumbs from "@/components/breadcrumbs";
import ProductGallery from "@/components/product-gallery";
import ProductOrderActions from "@/components/product-order-actions";
import { siteConfig } from "@/data/site";
import { primaryImage } from "@/lib/images";

interface ProductPageProps {
	params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: ProductPageProps) {
	const resolvedParams = await params;
	const product = await prisma.product.findFirst({
		where: { slug: resolvedParams.slug, archivedAt: null, isActive: true },
		select: { name: true, description: true },
	});

	if (!product) {
		return { title: "Product" };
	}

	return {
		title: product.name,
		description: product.description,
	};
}

export default async function ProductPage({ params }: ProductPageProps) {
	const resolvedParams = await params;
	const product = await prisma.product.findFirst({
		where: { slug: resolvedParams.slug, archivedAt: null, isActive: true },
		include: { category: true },
	});

	if (!product) return notFound();

	const isCategoryVisible =
		product.category &&
		product.category.isActive &&
		!product.category.archivedAt;
	const categoryName = isCategoryVisible ? product.category.name : "Pretty Picks";
	const categorySlug = isCategoryVisible ? product.category.slug : null;

	const related = await prisma.product.findMany({
		where: {
			categoryId: product.categoryId,
			NOT: { id: product.id },
			archivedAt: null,
			isActive: true,
		},
		take: 4,
		include: { category: true },
	});
	const sanitizedRelated = related.map((item) => {
		const isRelCatVisible =
			item.category &&
			item.category.isActive &&
			!item.category.archivedAt;
		return {
			...item,
			category: isRelCatVisible ? item.category : null,
		};
	});

	const productUrl = `https://${siteConfig.domain}/products/${product.slug}`;

	return (
		<div className="page-shell section-pad pb-24 md:pb-12">
			<div className="grid gap-10 md:grid-cols-[1.05fr_0.95fr]">
				<ProductGallery images={product.images} name={product.name} />
				<div>
					<Breadcrumbs
						items={[
							{ label: "Home", href: "/" },
							...(categorySlug
								? [{ label: categoryName, href: `/category/${categorySlug}` }]
								: [{ label: categoryName }]),
							{ label: product.name },
						]}
					/>
					<p className="eyebrow">{categoryName}</p>
					<h1 className="mt-4 font-[var(--font-heading)] text-4xl font-medium tracking-tight text-[var(--pp-ink)]">
						{product.name}
					</h1>
					<p className="mt-3 text-lg font-semibold text-[var(--pp-ink)]">
						{formatCurrency(product.price)}
					</p>
					<p className="mt-4 text-base leading-relaxed text-[var(--pp-muted)]">
						{product.description}
					</p>
					<div className="mt-6 grid gap-3 rounded-2xl border border-[var(--pp-border)] bg-white p-4 text-sm">
						<div className="flex items-center justify-between">
							<span className="text-[var(--pp-muted)]">Material</span>
							<span className="font-medium">{product.material}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-[var(--pp-muted)]">Category</span>
							{categorySlug ? (
								<Link href={`/category/${categorySlug}`} className="font-medium">
									{categoryName}
								</Link>
							) : (
								<span className="font-medium">{categoryName}</span>
							)}
						</div>
						<div className="flex items-center justify-between">
							<span className="text-[var(--pp-muted)]">Stock</span>
							<span className="font-medium">{product.stock} pieces</span>
						</div>
					</div>
					<ProductOrderActions
						id={product.id}
						name={product.name}
						price={product.price}
						productUrl={productUrl}
						image={primaryImage(product.images)}
					/>
					<div className="mt-6">
						<Link href="/products" className="btn-outline text-sm">
							Back to products
						</Link>
					</div>
				</div>
			</div>

			<section className="mt-16">
				<div className="mb-6 flex items-end justify-between">
					<div>
						<p className="section-kicker">Related</p>
						<h2 className="section-title">Similar picks</h2>
					</div>
					{categorySlug && (
						<Link href={`/category/${categorySlug}`} className="text-sm text-[var(--pp-gold)]">
							View category
						</Link>
					)}
				</div>
				<ProductGrid products={sanitizedRelated} />
			</section>
		</div>
	);
}
