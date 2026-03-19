import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { siteConfig, trustBadges } from "@/data/site";
import ProductCard from "@/components/product-card";
import CategoryCard from "@/components/category-card";
import { primaryImage } from "@/lib/images";
import type { CategorySummary, ProductSummary } from "@/types/catalog";
import HeroCarousel from "@/components/hero-carousel";
import ScrollReveal from "@/components/scroll-reveal";
import CountdownTimer from "@/components/countdown-timer";
import CelebrationTrigger from "@/components/celebration-trigger";
import { getSiteSettings } from "@/lib/site-settings";

type HeroBannerRow = {
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
};

const hasRenderableBannerContent = (banner: HeroBannerRow) =>
	Boolean(banner.title?.trim()) && Boolean(banner.image?.trim());

export const revalidate = 60;
export const metadata = {
	title: "Pretty Picks | Affordable Artificial Jewellery Online India",
	description: "Shop trendy, affordable artificial jewellery at Pretty Picks. Earrings, necklaces, rings & bangles starting ₹99. Anti-tarnish, hypoallergenic & Instagram-ready styles. Free shipping across India.",
	keywords: [
		"artificial jewellery",
		"affordable jewellery online",
		"fashion jewellery India",
		"earrings online",
		"necklace set online",
		"rings for women",
		"bangles online India",
		"anti-tarnish jewellery",
		"Pretty Picks",
		"jewellery under 199",
		"trendy jewellery",
	],
};

export default async function HomePage() {
	let mostLovedProducts: ProductSummary[] = [];
	let categories: CategorySummary[] = [];
	let under199: ProductSummary[] = [];
	let galleryProducts: { id: string; name: string; slug: string; images: any }[] = [];
	let banners: HeroBannerRow[] = [];
	let serializedBanners: any[] = [];
	let siteSettings: any = null;
	let isLaunched = false;

	try {
		const results = await Promise.allSettled([
			prisma.product.findMany({
				where: { archivedAt: null, isActive: true },
				take: 4,
				orderBy: [{ orderItems: { _count: "desc" } }, { createdAt: "desc" }],
				select: {
					id: true,
					name: true,
					slug: true,
					price: true,
					createdAt: true,
					material: true,
					stock: true,
					images: true,
					_count: { select: { orderItems: true } },
					category: {
						select: { id: true, name: true, slug: true, image: true, isActive: true, archivedAt: true },
					},
					categoryId: true,
				},
			}),
			prisma.category.findMany({
				where: { archivedAt: null, isActive: true },
				orderBy: { name: "asc" },
				select: { id: true, name: true, slug: true, image: true },
			}),
			prisma.product.findMany({
				where: { price: { lte: 199 }, archivedAt: null, isActive: true },
				take: 3,
				orderBy: { price: "asc" },
				select: {
					id: true,
					name: true,
					slug: true,
					price: true,
					images: true,
				},
			}),
			prisma.heroBanner.findMany({
				where: { isActive: true },
				orderBy: { priority: "desc" },
			}),
			getSiteSettings(),
			prisma.product.findMany({
				where: { archivedAt: null, isActive: true },
				take: 6,
				orderBy: { createdAt: "desc" },
				select: { id: true, name: true, slug: true, images: true },
			}),
		]);

		const [lovedResult, categoriesResult, underResult, bannersResult, settingsResult, galleryResult] = results;

		if (settingsResult.status === "fulfilled") {
			siteSettings = settingsResult.value;
			if (siteSettings?.launchDate) {
				const now = new Date();
				const target = new Date(siteSettings.launchDate);
				isLaunched = now >= target;
			} else {
				isLaunched = true;
			}
		} else {
			isLaunched = true;
		}

		if (categoriesResult.status === "rejected") {
			console.error("HomePage: Categories failed to load.", categoriesResult.reason);
			throw new Error("Failed to load critical shop data.");
		}
		categories = categoriesResult.value;

		if (lovedResult.status === "fulfilled") {
			mostLovedProducts = lovedResult.value.map((product) => {
				const { _count, ...rest } = product;
				const isCategoryVisible =
					product.category &&
					product.category.isActive &&
					!product.category.archivedAt;
				return {
					...rest,
					category: isCategoryVisible ? product.category : null,
					orderCount: _count.orderItems,
				};
			});
		}

		if (underResult.status === "fulfilled") {
			under199 = underResult.value;
		}

		if (bannersResult.status === "fulfilled") {
			banners = bannersResult.value.filter(hasRenderableBannerContent);
		}

		if (galleryResult.status === "fulfilled") {
			galleryProducts = galleryResult.value;
		}

		// Serialize Date objects for client components
		serializedBanners = banners.map(b => ({
			...b,
			createdAt: b.createdAt.toISOString(),
			updatedAt: b.updatedAt.toISOString(),
		} as any));

		// Fallback banner if DB is empty or unreachable
		if (!serializedBanners.length) {
			const now = new Date().toISOString();
			serializedBanners = [
				{
					id: "default-1",
					eyebrow: "Pretty Picks",
					title: "Everyday *Elegance,* Every Piece",
					subtitle: "Curated artificial jewellery that's lightweight, anti-tarnish, and crafted for your everyday.",
					image: "/images/hero.svg",
					mobileImage: null,
					link: "/products",
					ctaLabel: "Shop Collection",
					priority: 0,
					isActive: true,
					createdAt: now,
					updatedAt: now,
				},
				{
					id: "default-2",
					eyebrow: "Fresh Drop",
					title: "Fresh *Drops* for Your Reel",
					subtitle: "Discover our latest collection of Instagram-ready styles that sparkle under every light.",
					image: "/images/hero.svg",
					mobileImage: null,
					link: "/products?sort=newest",
					ctaLabel: "View New Arrivals",
					priority: 0,
					isActive: true,
					createdAt: now,
					updatedAt: now,
				}
			];
		}
	} catch (error) {
		console.error("HomePage: Data fetching failed.", error);
		// Minimal fallback for server-side error
		return <div className="p-20 text-center">Unable to load storefront. Please try refreshing.</div>;
	}

	return (
		<>
			<CelebrationTrigger isLaunched={isLaunched} launchDate={siteSettings?.launchDate?.toISOString() ?? null} />
			{/* ── Conditional Hero Logic ── */}
			{siteSettings?.showCountdown && !isLaunched ? (
				<section className="relative h-[70vh] min-h-[420px] w-full overflow-hidden md:h-[calc(100vh-5rem)] md:min-h-[500px] bg-[var(--pp-beige)]">
					{/* Overlays (Matching Carousel) */}
					<div className="absolute inset-0 bg-gradient-to-r from-[var(--pp-beige)]/95 via-[var(--pp-beige)]/60 to-transparent" />
					<div className="absolute inset-0 bg-gradient-to-t from-[var(--pp-beige)]/50 via-transparent to-transparent" />

					{/* Background Decor (Matching Carousel Special Slide style) */}
					<div className="absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--pp-gold)]/10 blur-[120px]" />

					<div className="page-shell relative z-10 flex h-full flex-col items-center justify-center">
						<div className="max-w-4xl px-4 sm:px-0 text-center mx-auto">
							<ScrollReveal animation="fade-up" delay={100}>
								{/* Brand Logo */}
								{siteSettings.storefrontLogoUrl && (
									<div className="mb-6 flex justify-center">
										<Image
											src={siteSettings.storefrontLogoUrl}
											alt={siteSettings.storefrontLogoAlt || "Pretty Picks"}
											width={240}
											height={120}
											className="h-24 w-auto object-contain sm:h-28 md:h-20"
										/>
									</div>
								)}

								<div className="mb-3 flex items-center justify-center gap-3">
									<span className="h-px w-6 sm:w-10 bg-[var(--pp-gold)]" />
									<span className="eyebrow text-[var(--pp-gold)]">Coming Soon</span>
									<span className="h-px w-6 sm:w-10 bg-[var(--pp-gold)]" />
								</div>

								<h1 className="font-[var(--font-heading)] text-2xl font-light leading-tight tracking-tight text-[var(--pp-ink)] sm:text-5xl md:text-6xl lg:text-7xl">
									<span className="block mb-1">
										{"Our Full *Collection*".split("*").map((part, i) => (
											i % 2 === 1 ? <span key={i} className="italic text-[var(--pp-gold)]">{part}</span> : part
										))}
									</span>
									<span className="block">Arrives Soon</span>
								</h1>

								<p className="mx-auto mt-4 max-w-lg text-[10px] leading-relaxed text-[var(--pp-muted)] sm:text-sm md:text-base">
									Be among the first to explore our signature anti-tarnish jewelry. Join the waitlist for exclusive early-access perks.
								</p>
							</ScrollReveal>

							<ScrollReveal animation="fade-up" delay={300}>
								<div className="mt-10 flex justify-center">
									<CountdownTimer targetDate={siteSettings.launchDate!.toISOString()} />
								</div>
							</ScrollReveal>
						</div>
					</div>
				</section>
			) : (
				<HeroCarousel banners={serializedBanners} trustBadges={trustBadges} />
			)}

			{/* ── Most Loved (Fade Up) ── */}
			<section className="section-pad">
				<div className="page-shell">
					<ScrollReveal animation="fade-up">
						<div className="mb-6">
							<p className="eyebrow">Most loved</p>
							<h2 className="section-title">Most loved</h2>
						</div>
						<div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{mostLovedProducts.map((product) => (
								<ProductCard
									key={product.id}
									product={product}
									isLaunchMode={!isLaunched}
								/>
							))}
						</div>
						<div className="mt-6 flex justify-center">
							<Link href="/products?sort=popular" className="btn-primary btn-sweep text-sm">
								<span className="btn-sweep-label">View All</span>
							</Link>
						</div>
					</ScrollReveal>
				</div>
			</section>

			{/* ── Categories (Slide Horizontal) ── */}
			<section className="section-pad">
				<div className="page-shell">
					<ScrollReveal animation="slide-left">
						<div className="mb-6">
							<p className="eyebrow">Categories</p>
							<h2 className="section-title">Shop by mood</h2>
						</div>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							{categories.map((category) => (
								<CategoryCard key={category.id} category={category} />
							))}
						</div>
					</ScrollReveal>
				</div>
			</section>

			{/* ── Under ₹199 (Bold Banner) ── */}
			<section className="section-pad">
				<div className="page-shell">
					<ScrollReveal animation="zoom-in">
						<Link
							href="/products?price=199"
							className="group relative block overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--pp-ink)] via-[#2a2521] to-[var(--pp-ink)] px-8 py-14 text-center shadow-lg transition-shadow hover:shadow-xl md:py-20"
						>
							<div className="absolute inset-0 bg-[var(--pp-gold)]/5" />
							<div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--pp-gold)]/10 blur-[80px]" />
							<div className="relative z-10">
								<p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--pp-gold)]">Budget Picks</p>
								<h2 className="mt-3 font-[var(--font-heading)] text-4xl font-light text-white sm:text-5xl md:text-6xl">
									Under <span className="text-[var(--pp-gold)]">₹199</span>
								</h2>
								<p className="mx-auto mt-3 max-w-md text-sm text-white/60">
									Big sparkle, small price. Premium-looking pieces that won't break the bank.
								</p>
								<span className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--pp-gold)]/30 bg-[var(--pp-gold)]/10 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pp-gold)] backdrop-blur-sm transition-all group-hover:bg-[var(--pp-gold)] group-hover:text-[var(--pp-ink)]">
									Explore Collection
									<span className="transition-transform group-hover:translate-x-1">→</span>
								</span>
							</div>
						</Link>
					</ScrollReveal>
				</div>
			</section>

			{/* ── Instagram / Gallery (Fade In Staggered) ── */}
			{galleryProducts.length > 0 && (
				<section className="section-pad">
					<div className="page-shell text-center sm:text-left">
						<ScrollReveal animation="fade-in">
							<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<p className="eyebrow">Instagram</p>
									<h2 className="section-title">Shop our looks</h2>
								</div>
								<a
									href={siteConfig.instagramUrl}
									target="_blank"
									rel="noreferrer"
									className="btn-secondary text-sm w-full sm:w-auto text-center"
								>
									Follow @prettypicksby__rj
								</a>
							</div>
							<div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
								{galleryProducts.map((product, idx) => (
									<ScrollReveal key={product.id} animation="stagger" delay={idx * 100} className="w-full">
										<Link
											href={`/products/${product.slug}`}
											className="group relative block aspect-square w-full overflow-hidden bg-[var(--pp-beige)]"
										>
											<Image
												src={primaryImage(product.images)}
												alt={product.name}
												fill
												className="object-cover transition-transform duration-300 group-hover:scale-105"
											/>
											<div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
											<div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/60 to-transparent px-3 py-2 transition-transform duration-300 group-hover:translate-y-0">
												<p className="text-[10px] font-semibold text-white truncate">{product.name}</p>
											</div>
										</Link>
									</ScrollReveal>
								))}
							</div>
						</ScrollReveal>
					</div>
				</section>
			)}
		</>
	);
}
