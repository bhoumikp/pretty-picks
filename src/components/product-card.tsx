"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { normalizeImages, primaryImage } from "@/lib/images";
import { toggleWishlist, getWishlist, type WishlistItem } from "@/lib/wishlist";
import { getCart, setCartItemQuantity, type CartItem } from "@/lib/cart";
import { trackEvent } from "@/lib/analytics";
import type { ProductSummary } from "@/types/catalog";

interface ProductCardProps {
	product: ProductSummary;
	variant?: "grid" | "scroll" | "carousel";
	index?: number;
	size?: "default" | "compact";
	isLaunchMode?: boolean;
}

export default function ProductCard({
	product,
	variant = "grid",
	index = 0,
	size = "default",
	isLaunchMode = false,
}: ProductCardProps) {
	const images = normalizeImages(product.images);
	const image = images[0]?.url ?? primaryImage(product.images);
	const hoverImage = images[1]?.url;
	const [wishlisted, setWishlisted] = useState(false);
	const [cartQty, setCartQty] = useState(0);
	const [added, setAdded] = useState(false);

	const [now, setNow] = useState<number | null>(null);
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setNow(Date.now()), []);

	const createdAt = product.createdAt ? new Date(product.createdAt) : new Date();
	const isNew = now ? now - createdAt.getTime() < 1000 * 60 * 60 * 24 * 14 : false;

	const badge = isNew
		? "New"
		: product.price <= 199
			? "Under ₹199"
			: product.stock && product.stock <= 5
				? "Limited"
				: undefined;
	const badgeTone = isNew
		? "bg-[var(--pp-beige)] text-[var(--pp-ink)]"
		: product.price <= 199
			? "bg-white/90 text-[var(--pp-ink)]"
			: "bg-[var(--pp-ink)]/90 text-white";

	const materialLabel = product.material?.trim();
	const descriptionLabel = product.description?.trim();
	const shortDescription = (text: string, max = 64) =>
		text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
	const metaLine = materialLabel
		? materialLabel
		: descriptionLabel
			? shortDescription(descriptionLabel)
			: undefined;
	const inCart = cartQty > 0;
	const cartLabel = inCart ? "In cart" : "Add";
	const handleCartToggle = () => {
		const targetQty = inCart ? 0 : 1;
		const next = setCartItemQuantity(
			{
				id: product.id,
				name: product.name,
				slug: product.slug,
				price: product.price,
				image,
			},
			targetQty
		);
		const entry = next.find((item) => item.id === product.id);
		const nextQty = entry?.quantity ?? 0;
		setCartQty(nextQty);
		if (nextQty > 0) {
			trackEvent("add_to_cart", { id: product.id, quantity: nextQty });
		} else {
			trackEvent("remove_from_cart", { id: product.id });
		}
		setAdded(true);
		window.setTimeout(() => setAdded(false), 600);
	};

	useEffect(() => {
		const readCart = (items?: CartItem[]) => {
			const current = items ?? getCart();
			const entry = current.find((item) => item.id === product.id);
			const nextQty = entry?.quantity ?? 0;
			setCartQty(nextQty);
		};

		const readWishlist = (items?: WishlistItem[]) => {
			const current = items ?? getWishlist();
			setWishlisted(current.some((item) => item.id === product.id));
		};

		readCart();
		readWishlist();

		const cartHandler = (event: Event) => {
			const customEvent = event as CustomEvent<CartItem[]>;
			readCart(customEvent.detail);
		};
		const wishlistHandler = (event: Event) => {
			const customEvent = event as CustomEvent<WishlistItem[]>;
			readWishlist(customEvent.detail);
		};
		const storageCartHandler = () => readCart();
		const storageWishlistHandler = () => readWishlist();

		window.addEventListener("pp-cart-updated", cartHandler);
		window.addEventListener("pp-wishlist-updated", wishlistHandler);
		window.addEventListener("storage", storageCartHandler);
		window.addEventListener("storage", storageWishlistHandler);
		return () => {
			window.removeEventListener("pp-cart-updated", cartHandler);
			window.removeEventListener("pp-wishlist-updated", wishlistHandler);
			window.removeEventListener("storage", storageCartHandler);
			window.removeEventListener("storage", storageWishlistHandler);
		};
	}, [product.id]);

	const isScroll = variant === "scroll"; // Define isScroll based on variant
	const isCompact = size === "compact";

	return (
		<div
			className={`group relative flex flex-col overflow-hidden bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 zoom-in-95 fill-mode-both ${isScroll ? "w-[240px] shrink-0 lg:w-auto" : "w-full"
				}`}
			style={{
				animationDelay: index ? `${index * 50}ms` : "0ms",
			}}
		>
			<div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--pp-beige)]">
				<Link
					href={`/products/${product.slug}`}
					className="absolute inset-0 z-0"
					onClick={() => trackEvent("product_click", { id: product.id })}
				>
					<span className="relative block h-full w-full">
						<Image
							src={image}
							alt={product.name}
							fill
							className={`object-cover transition-all duration-500 ${hoverImage ? "opacity-100 group-hover:opacity-0" : "group-hover:scale-[1.03]"
								}`}
						/>
						{hoverImage && (
							<Image
								src={hoverImage}
								alt={product.name}
								fill
								className="object-cover opacity-0 transition-all duration-500 group-hover:opacity-100"
							/>
						)}
					</span>
				</Link>
				<div className="pointer-events-none absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-0" />
				{badge && (
					<span
						className={`absolute left-3 top-3 rounded-full px-3 py-1 scale-90 sm:scale-100 text-[10px] font-semibold uppercase tracking-[0.2em] shadow-sm ${badgeTone}`}
					>
						{badge}
					</span>
				)}
				<button
					className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 sm:p-2 shadow-sm transition-all hover:scale-105"
					onClick={() => {
						const next = toggleWishlist({
							id: product.id,
							name: product.name,
							slug: product.slug,
							price: product.price,
							image,
						});
						setWishlisted(next.some((item) => item.id === product.id));
						trackEvent("wishlist_toggle", { id: product.id });
					}}
				>
					<span className="sr-only">Add to wishlist</span>
					<svg width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor">
						<path
							d="M12 20s-6.5-4.35-8.5-7.5C1.5 9 3 6 6 6c2 0 3.5 1.5 6 4 2.5-2.5 4-4 6-4 3 0 4.5 3 2.5 6.5C18.5 15.65 12 20 12 20z"
							strokeWidth="1.4"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
				{!isLaunchMode && (
					<div className={`absolute bottom-3 right-3 z-10 flex flex-col gap-2 transition-all duration-300 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 opacity-100 translate-y-0 ${isCompact ? "scale-90" : ""}`}>
						<button
							className={`group/button flex h-9 min-w-9 lg:h-10 lg:min-w-10 items-center justify-center rounded-full border px-2 lg:px-3 text-[9px] lg:text-[10px] font-medium uppercase tracking-[0.14em] transition-all cursor-pointer ${inCart
									? "border-[var(--pp-gold)] bg-[var(--pp-gold)] text-[var(--pp-ink)]"
									: "border-white/70 bg-white/90 text-[var(--pp-ink)] hover:bg-white"
								} ${added ? "cart-pop ring-1 ring-[var(--pp-gold)]/35" : ""}`}
							onClick={handleCartToggle}
						>
							<span className="sr-only">{inCart ? "In cart" : "Add to cart"}</span>
							{inCart ? (
								<svg width="16" height="16" className="lg:w-[18px] lg:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path d="M7 4H5L3 18H19L21 8H7" strokeWidth="1.6" strokeLinecap="round" />
									<path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
									<path d="M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
									<path d="m9 11 2 2 4-4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							) : (
								<svg width="16" height="16" className="lg:w-[18px] lg:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path d="M7 4H5L3 18H19L21 8H7" strokeWidth="1.6" strokeLinecap="round" />
									<path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
									<path d="M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
									<path d="M9 12h6" strokeWidth="1.6" strokeLinecap="round" />
								</svg>
							)}
							<span className="ml-1 max-w-24 overflow-hidden whitespace-nowrap text-[9px] lg:text-[10px] uppercase tracking-[0.14em] opacity-100 transition-all duration-300 lg:ml-0 lg:max-w-0 lg:opacity-0 lg:group-hover/button:ml-1.5 lg:group-hover/button:max-w-24 lg:group-hover/button:opacity-100">
								{cartLabel}
							</span>
						</button>
					</div>
				)}
			</div>
			<div className={`flex flex-1 flex-col gap-1 px-2 pb-3 pt-2 sm:px-3 sm:pb-4 sm:pt-3 ${isCompact ? "lg:gap-0.5 lg:px-2 lg:pb-2.5 lg:pt-2" : ""}`}>
				<div className="flex items-center justify-between gap-2">
					<span className={`text-[8px] font-semibold uppercase tracking-[0.2em] text-[var(--pp-muted)] md:tracking-[0.26em] ${isCompact ? "lg:text-[7.5px]" : ""}`}>
						{product.category?.name ?? "Pretty Picks"}
					</span>
					{product.stock === 0 && (
						<span className="text-[9px] uppercase tracking-[0.22em] text-[var(--pp-muted)]">
							Out of stock
						</span>
					)}
				</div>
				<Link
					href={`/products/${product.slug}`}
					className={`font-semibold leading-snug tracking-tight text-[var(--pp-ink)] line-clamp-1 transition-colors hover:text-[var(--pp-gold)] sm:min-h-0 ${isCompact ? "text-[12px] lg:text-[13px]" : "text-[13px] sm:text-[14px]"}`}
					onClick={() => trackEvent("product_click", { id: product.id })}
				>
					{product.name}
				</Link>
				{metaLine && (
					<p className={`leading-relaxed text-[var(--pp-muted)] line-clamp-1 ${isCompact ? "hidden lg:block text-[9px]" : "text-[10px]"}`}>
						{metaLine}
					</p>
				)}
				<p className={`font-semibold shadow-gold-sm tracking-wide text-[var(--pp-ink)] sm:mt-0.5 ${isCompact ? "text-[13px] lg:text-[14px]" : "mt-1 text-[14px] sm:text-[15px]"}`}>
					{formatCurrency(product.price)}
				</p>
			</div>
		</div>
	);
}
