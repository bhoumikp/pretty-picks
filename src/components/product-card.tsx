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

const NOW = Date.now();

interface ProductCardProps {
  product: ProductSummary;
  variant?: "grid" | "scroll" | "carousel";
}

export default function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const images = normalizeImages(product.images);
  const image = images[0]?.url ?? primaryImage(product.images);
  const hoverImage = images[1]?.url;
  const [wishlisted, setWishlisted] = useState(false);
  const [cartQty, setCartQty] = useState(0);
  const [added, setAdded] = useState(false);

  const createdAt = product.createdAt ? new Date(product.createdAt) : undefined;
  const isNew = createdAt ? NOW - createdAt.getTime() < 1000 * 60 * 60 * 24 * 14 : false;
  const badge = isNew
    ? "New"
    : product.featured
    ? "Best Seller"
    : product.price <= 199
    ? "Under ₹199"
    : product.stock && product.stock <= 5
    ? "Limited"
    : undefined;
  const badgeTone = isNew
    ? "bg-[var(--pp-beige)] text-[var(--pp-ink)]"
    : product.featured
    ? "bg-[var(--pp-gold)]/90 text-[var(--pp-ink)]"
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

  return (
    <div
      className={`group flex h-full flex-col bg-white transition-all duration-300 ${
        variant === "scroll"
          ? "min-w-[240px] snap-start sm:min-w-[260px] md:min-w-[280px] lg:min-w-0"
          : ""
      } ${
        variant === "carousel"
          ? "min-w-full shrink-0 snap-start basis-full sm:min-w-[50%] sm:basis-1/2 md:min-w-[33.333%] md:basis-1/3 lg:min-w-[25%] lg:basis-1/4"
          : ""
      }`}
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
              className={`object-cover transition-all duration-500 ${
                hoverImage ? "opacity-100 group-hover:opacity-0" : "group-hover:scale-[1.03]"
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
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] shadow-sm ${badgeTone}`}
          >
            {badge}
          </span>
        )}
        <button
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-sm transition-all hover:scale-105"
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor">
            <path
              d="M12 20s-6.5-4.35-8.5-7.5C1.5 9 3 6 6 6c2 0 3.5 1.5 6 4 2.5-2.5 4-4 6-4 3 0 4.5 3 2.5 6.5C18.5 15.65 12 20 12 20z"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="absolute bottom-3 right-3 z-10 flex translate-y-2 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            className={`group/button flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-[9px] font-medium uppercase tracking-[0.14em] transition-all cursor-pointer ${
              inCart
                ? "border-[var(--pp-gold)] bg-[var(--pp-gold)] text-[var(--pp-ink)]"
                : "border-white/70 bg-white/90 text-[var(--pp-ink)] hover:bg-white"
            } ${added ? "cart-pop ring-1 ring-[var(--pp-gold)]/35" : ""}`}
            onClick={handleCartToggle}
          >
            <span className="sr-only">{inCart ? "In cart" : "Add to cart"}</span>
            {inCart ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 4H5L3 18H19L21 8H7" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                <path d="M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                <path d="m9 11 2 2 4-4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 4H5L3 18H19L21 8H7" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                <path d="M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                <path d="M9 12h6" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
            <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap text-[9px] uppercase tracking-[0.14em] opacity-0 transition-all duration-300 group-hover/button:ml-1 group-hover/button:max-w-24 group-hover/button:opacity-100">
              {cartLabel}
            </span>
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-2.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[var(--pp-muted)]">
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
          className="text-[13px] font-semibold leading-snug tracking-tight sm:min-h-0 sm:text-[14px]"
          onClick={() => trackEvent("product_click", { id: product.id })}
        >
          {product.name}
        </Link>
        {metaLine && (
          <p className="text-[10px] leading-relaxed text-[var(--pp-muted)] line-clamp-1">
            {metaLine}
          </p>
        )}
        <p className="text-[14px] font-semibold tracking-wide text-[var(--pp-ink)] sm:text-[15px]">
          {formatCurrency(product.price)}
        </p>
      </div>
    </div>
  );
}
