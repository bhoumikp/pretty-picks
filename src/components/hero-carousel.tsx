"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { siteConfig } from "@/data/site";

interface Banner {
	id: string;
	eyebrow?: string | null;
	title: string;
	subtitle?: string | null;
	image: string;
	mobileImage?: string | null;
	link?: string | null;
	ctaLabel?: string | null;
}

interface HeroCarouselProps {
	banners: Banner[];
	trustBadges: string[];
}

export default function HeroCarousel({ banners, trustBadges }: HeroCarouselProps) {
	const renderableBanners = banners.filter((banner) => banner.title?.trim() && banner.image?.trim());
	const [activeIdx, setActiveIdx] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const [isVisible, setIsVisible] = useState(true);
	const next = () => setActiveIdx((prev) => (prev + 1) % renderableBanners.length);
	const prev = () => setActiveIdx((prev) => (prev - 1 + renderableBanners.length) % renderableBanners.length);

	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsVisible(!document.hidden);
		};
		handleVisibilityChange();
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, []);

	// Auto-play stays quiet while the user is interacting or the tab is hidden.
	useEffect(() => {
		if (renderableBanners.length <= 1 || isPaused || !isVisible) return;
		const interval = setInterval(() => {
			setActiveIdx((prev) => (prev + 1) % renderableBanners.length);
		}, 7000);
		return () => clearInterval(interval);
	}, [renderableBanners.length, isPaused, isVisible]);

	if (!renderableBanners.length) return null;

	return (
		<section
			id="hero"
			className="relative h-[calc(100vh-4rem)] min-h-[500px] w-full overflow-hidden md:h-[calc(100vh-5rem)]"
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
			onFocusCapture={() => setIsPaused(true)}
			onBlurCapture={() => setIsPaused(false)}
		>
			{/* Slider track - Hardware accelerated for performance */}
			<div
				className="hero-carousel-track flex h-full w-full transition-transform duration-700 ease-out will-change-transform"
				style={{
					transform: `translate3d(-${activeIdx * 100}%, 0, 0)`,
					backfaceVisibility: "hidden"
				}}
				suppressHydrationWarning
			>
				{renderableBanners.map((banner, idx) => (

					<div
						key={banner.id}
						className="relative h-full w-full min-w-full shrink-0 overflow-hidden bg-[var(--pp-beige)]"
					>
						{/* Background Image */}
						<Image
							src={banner.mobileImage || banner.image}
							alt={banner.title}
							fill
							className="object-cover object-center md:hidden"
							priority={idx < 2}
						/>
						<Image
							src={banner.image}
							alt={banner.title}
							fill
							className="hidden object-cover object-center md:block"
							priority={idx < 2}
						/>

						{/* Overlays */}
						<div className="absolute inset-0 bg-gradient-to-r from-[var(--pp-beige)]/95 via-[var(--pp-beige)]/60 to-transparent" />
						<div className="absolute inset-0 bg-gradient-to-t from-[var(--pp-beige)]/50 via-transparent to-transparent" />

						{/* Content */}
						<div 
							className="page-shell relative z-10 flex h-full flex-col justify-center pt-32 pb-12 sm:pt-0 sm:pb-0"
							suppressHydrationWarning
						>
							<div className="max-w-4xl px-4 sm:px-0">
								{/* Eyebrow */}
								<div className="mb-4 flex items-center gap-3">
									<span className="h-px w-10 bg-[var(--pp-gold)]" />
									<span className="eyebrow text-[var(--pp-gold)]">{banner.eyebrow || "Pretty Picks"}</span>
								</div>

								{/* Headline - One line requirement on large screens, but allow wrap if needed */}
								<h1 className="font-[var(--font-heading)] text-4xl font-light leading-tight tracking-tight text-[var(--pp-ink)] sm:text-5xl md:text-6xl lg:text-[5.5rem] lg:max-w-full overflow-hidden">
									{banner.title.split("*").map((part, i) => (
										i % 2 === 1 ? <span key={i} className="italic text-[var(--pp-gold)]">{part}</span> : part
									))}
								</h1>

								<p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--pp-muted)] sm:text-base">
									{banner.subtitle || "Curated artificial jewellery that's lightweight, anti-tarnish, and crafted for your everyday moments."}
								</p>

								{/* CTAs */}
								<div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
									<Link href={banner.link || "/products"} className="btn-sweep w-full border-none py-4 text-center text-sm font-semibold sm:w-auto sm:px-8">
										<span className="btn-sweep-label">{banner.ctaLabel || "Shop Collection"}</span>
									</Link>
									<a
										href={siteConfig.instagramUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="btn-secondary w-full py-4 text-center text-sm font-semibold sm:w-auto sm:px-8"
									>
										View Lookbook
									</a>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Navigation Controls */}
			{renderableBanners.length > 1 && (
				<>
					{/* Indicators */}
					<div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 gap-3 pb-safe">
						{renderableBanners.map((_, i) => (
							<button
								key={i}
								onClick={() => {
									setIsPaused(true);
									setActiveIdx(i);
								}}
								className={`h-1.5 transition-all duration-300 ${activeIdx === i ? "w-8 bg-[var(--pp-gold)]" : "w-1.5 bg-[var(--pp-gold)]/30 rounded-full"
									}`}
								aria-label={`Go to slide ${i + 1}`}
							/>
						))}
					</div>

					{/* Arrows */}
					<button
						onClick={() => {
							setIsPaused(true);
							prev();
						}}
						className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-[var(--pp-ink)] backdrop-blur-md transition hover:bg-white/50 hidden lg:flex"
						aria-label="Previous slide"
					>
						<ChevronLeft className="h-6 w-6" />
					</button>
					<button
						onClick={() => {
							setIsPaused(true);
							next();
						}}
						className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-[var(--pp-ink)] backdrop-blur-md transition hover:bg-white/50 hidden lg:flex"
						aria-label="Next slide"
					>
						<ChevronRight className="h-6 w-6" />
					</button>
				</>
			)}

			{/* Scroll hint */}
			<div className="absolute bottom-6 right-8 hidden flex-col items-center gap-2 lg:flex">
				<span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--pp-muted)]/50 [writing-mode:vertical-rl]">
					Scroll
				</span>
				<span className="h-8 w-px animate-pulse bg-[var(--pp-gold)]/50" />
			</div>
		</section>
	);
}
