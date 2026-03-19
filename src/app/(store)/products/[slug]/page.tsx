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
import { getSiteSettings } from "@/lib/site-settings";

interface ProductPageProps {
	params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: ProductPageProps) {
	const resolvedParams = await params;
	const product = await prisma.product.findFirst({
		where: { slug: resolvedParams.slug, archivedAt: null, isActive: true },
		select: { name: true, description: true, price: true, images: true },
	});

	if (!product) {
		return { title: "Product" };
	}

	const image = primaryImage(product.images);
	const description = `${product.name} — ₹${product.price}. ${product.description ?? "Shop at Pretty Picks for affordable artificial jewellery."}`;

	return {
		title: product.name,
		description,
		openGraph: {
			title: `${product.name} | Pretty Picks`,
			description,
			...(image && { images: [{ url: image, width: 800, height: 1000, alt: product.name }] }),
		},
		twitter: {
			card: "summary_large_image",
			title: `${product.name} | Pretty Picks`,
			description,
			...(image && { images: [image] }),
		},
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

	// If no related products, fetch "Most Loved" products as fallback
	let fallbackProducts: any[] = [];
	if (sanitizedRelated.length === 0) {
		const mostLoved = await prisma.product.findMany({
			where: { archivedAt: null, isActive: true },
			take: 4,
			orderBy: { createdAt: "desc" }, // Simple fallback for now
			include: { category: true },
		});
		fallbackProducts = mostLoved.map((item) => {
			const isFCatVisible = item.category && item.category.isActive && !item.category.archivedAt;
			return { ...item, category: isFCatVisible ? item.category : null };
		});
	}
	
	const siteSettings = await getSiteSettings();
	const isLaunched = siteSettings?.launchDate ? new Date() >= siteSettings.launchDate : true;
	const isLaunchMode = Boolean(siteSettings?.showCountdown && !isLaunched);

	const productUrl = `https://${siteConfig.domain}/products/${product.slug}`;

	const productJsonLd = {
		"@context": "https://schema.org",
		"@type": "Product",
		name: product.name,
		description: product.description,
		image: primaryImage(product.images),
		url: productUrl,
		brand: {
			"@type": "Brand",
			name: siteConfig.name,
		},
		offers: {
			"@type": "Offer",
			price: product.price,
			priceCurrency: "INR",
			availability: product.stock > 0
				? "https://schema.org/InStock"
				: "https://schema.org/OutOfStock",
			seller: {
				"@type": "Organization",
				name: siteConfig.name,
			},
		},
		...(product.material && { material: product.material }),
		...(categoryName && { category: categoryName }),
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
			/>
			<div className="page-shell section-pad pb-24 md:pb-12">
			{/* Mobile Breadcrumbs & Back */}
			<div className="mb-6 flex items-center justify-between md:hidden">
				<Breadcrumbs
					items={[
						{ label: "Home", href: "/" },
						...(categorySlug
							? [{ label: categoryName, href: `/category/${categorySlug}` }]
							: [{ label: categoryName }]),
						{ label: product.name },
					]}
				/>
				<Link
					href="/products"
					className="group flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--pp-muted)] transition-colors hover:text-[var(--pp-gold)]"
				>
					<span className="transition-transform group-hover:-translate-x-1">←</span>
					<span>Back</span>
				</Link>
			</div>

			<div className="grid gap-10 md:grid-cols-[4.5fr_5.5fr] lg:gap-16">
				<ProductGallery images={product.images} name={product.name} />
				<div>
					{/* Desktop Breadcrumbs & Back */}
					<div className="mb-6 hidden items-center justify-between md:flex">
						<Breadcrumbs
							items={[
								{ label: "Home", href: "/" },
								...(categorySlug
									? [{ label: categoryName, href: `/category/${categorySlug}` }]
									: [{ label: categoryName }]),
								{ label: product.name },
							]}
						/>
						<Link
							href="/products"
							className="group flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--pp-muted)] transition-colors hover:text-[var(--pp-gold)]"
						>
							<span className="transition-transform group-hover:-translate-x-1">←</span>
							<span>Back</span>
						</Link>
					</div>
					<p className="eyebrow tracking-[0.2em]">{categoryName}</p>
					<h1 className="mt-4 font-[var(--font-heading)] text-4xl font-light leading-tight tracking-tight text-[var(--pp-ink)] md:text-5xl lg:text-6xl">
						{product.name}
					</h1>
					<p className="mt-3 text-2xl font-light tracking-tight text-[var(--pp-gold)]">
						{formatCurrency(product.price)}
					</p>
					<p className="mt-6 text-sm leading-relaxed text-[var(--pp-muted)] md:text-base lg:max-w-md">
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
						isLaunchMode={isLaunchMode}
					/>
				</div>
			</div>

			{(sanitizedRelated.length > 0 || fallbackProducts.length > 0) && (
				<section className="mt-10 border-t border-[var(--pp-border)] pt-12">
					<div className="mb-10 flex items-end justify-between">
						<div>
							<p className="section-kicker">
								{sanitizedRelated.length > 0 ? "Related" : "Discover more"}
							</p>
							<h2 className="section-title">
								{sanitizedRelated.length > 0 ? "Similar picks" : "Most loved pieces"}
							</h2>
						</div>
						{sanitizedRelated.length > 0 && categorySlug && (
							<Link href={`/category/${categorySlug}`} className="text-sm font-medium text-[var(--pp-gold)] hover:underline">
								View category
							</Link>
						)}
					</div>
					<ProductGrid 
						products={sanitizedRelated.length > 0 ? sanitizedRelated : fallbackProducts} 
						isLaunchMode={isLaunchMode}
					/>
				</section>
			)}
		</div>
		</>
	);
}
